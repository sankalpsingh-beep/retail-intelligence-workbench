
import re
from typing import Any

import pandas as pd


ALLOWED_OPERATIONS = {
    "count_products",
    "average_price",
    "total_stock",
    "category_summary",
    "top_products_by_stock",
}


class UnsupportedQuestionError(Exception):
    """Raised when a question is outside supported retail capabilities."""


def _previous_plan(conversation_history: list[dict] | None):
    """Find the most recent successful query plan in the conversation."""

    for message in reversed(conversation_history or []):
        if message.get("role") != "assistant":
            continue

        content = message.get("content")

        if isinstance(content, dict):
            plan = content.get("plan")
            if isinstance(plan, dict):
                return plan

    return None


def build_query_plan(
    question: str,
    conversation_history: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Convert a retail question into an allow-listed structured plan.

    This is a deterministic intent parser, not an LLM integration.
    It supports contextual follow-ups using persisted conversation history.
    """

    if not question or not question.strip():
        raise UnsupportedQuestionError("Please enter a question.")

    normalized = re.sub(r"\s+", " ", question.lower()).strip()
    previous = _previous_plan(conversation_history)

    # Contextual follow-up: "next 1 product", "show the next 3",
    # "what about the next product?"
    is_next_request = bool(
        re.search(r"\b(next|following|more)\b", normalized)
    )

    if is_next_request and previous:
        previous_operation = previous.get("operation")

        if previous_operation == "top_products_by_stock":
            previous_parameters = previous.get("parameters", {})
            previous_limit = previous_parameters.get("limit", 5)
            previous_offset = previous_parameters.get("offset", 0)

            number_match = re.search(r"\b(\d+)\b", normalized)
            requested_limit = (
                int(number_match.group(1)) if number_match else previous_limit
            )

            requested_limit = min(max(requested_limit, 1), 20)
            next_offset = previous_offset + previous_limit

            return {
                "operation": "top_products_by_stock",
                "parameters": {
                    "limit": requested_limit,
                    "offset": next_offset,
                },
            }

        if previous_operation in ALLOWED_OPERATIONS:
            raise UnsupportedQuestionError(
                "The previous query does not have a next-results option. "
                "Please ask a new supported retail question."
            )

    # Top products by stock / inventory.
    if any(
        word in normalized
        for word in ["top", "highest", "most stock"]
    ):
        if "stock" in normalized or "inventory" in normalized:
            match = re.search(r"\btop\s+(\d+)", normalized)
            limit = int(match.group(1)) if match else 5

            return {
                "operation": "top_products_by_stock",
                "parameters": {
                    "limit": min(max(limit, 1), 20),
                    "offset": 0,
                },
            }

    # Category summary.
    if "category" in normalized and any(
        word in normalized
        for word in ["summary", "breakdown", "distribution"]
    ):
        return {
            "operation": "category_summary",
            "parameters": {},
        }

    # Average product price.
    if (
        any(word in normalized for word in ["average", "avg", "mean"])
        and any(word in normalized for word in ["price", "cost", "selling"])
    ):
        return {
            "operation": "average_price",
            "parameters": {},
        }

    # Total stock / inventory.
    if any(
        phrase in normalized
        for phrase in [
            "total stock",
            "total inventory",
            "stock available",
            "available stock",
            "inventory units",
            "stock quantity",
        ]
    ):
        return {
            "operation": "total_stock",
            "parameters": {},
        }

    # Product count.
    if any(
        phrase in normalized
        for phrase in [
            "how many products",
            "number of products",
            "count products",
            "product count",
            "total products",
        ]
    ):
        return {
            "operation": "count_products",
            "parameters": {},
        }

    raise UnsupportedQuestionError(
        "I cannot answer that question yet. "
        "Try asking about product count, average price, total stock, "
        "category breakdown, or top products by stock."
    )


def validate_query_plan(plan: dict[str, Any]) -> dict[str, Any]:
    """Validate the structured plan before execution."""

    if not isinstance(plan, dict):
        raise ValueError("Query plan must be an object.")

    operation = plan.get("operation")
    parameters = plan.get("parameters", {})

    if operation not in ALLOWED_OPERATIONS:
        raise ValueError("This operation is not allowed.")

    if not isinstance(parameters, dict):
        raise ValueError("Plan parameters must be an object.")

    if operation == "top_products_by_stock":
        limit = parameters.get("limit", 5)
        offset = parameters.get("offset", 0)

        if (
            not isinstance(limit, int)
            or isinstance(limit, bool)
            or not 1 <= limit <= 20
        ):
            raise ValueError("The result limit must be between 1 and 20.")

        if (
            not isinstance(offset, int)
            or isinstance(offset, bool)
            or not 0 <= offset <= 10000
        ):
            raise ValueError("The result offset is invalid.")

        parameters = {
            "limit": limit,
            "offset": offset,
        }

    elif parameters:
        raise ValueError(
            "This operation does not accept additional parameters."
        )

    return {
        "operation": operation,
        "parameters": parameters,
    }


def execute_query_plan(
    df: pd.DataFrame,
    plan: dict[str, Any],
    dataset_id: str,
    dataset_version: str = "original",
) -> dict[str, Any]:
    """Execute a validated retail query and return supporting evidence."""

    if df.empty:
        raise ValueError("The selected dataset is empty.")

    validated_plan = validate_query_plan(plan)
    operation = validated_plan["operation"]
    parameters = validated_plan["parameters"]

    columns = {
        str(column).strip().lower(): column
        for column in df.columns
    }

    result: Any
    columns_used: list[str] = []

    if operation == "count_products":
        if "product" not in columns:
            raise ValueError("The dataset needs a product column.")

        product_column = columns["product"]
        columns_used = [str(product_column)]

        result = {
            "product_count": int(df[product_column].notna().sum())
        }

    elif operation == "average_price":
        if "price" not in columns:
            raise ValueError("The dataset needs a price column.")

        price_column = columns["price"]
        columns_used = [str(price_column)]

        prices = pd.to_numeric(df[price_column], errors="coerce")
        average = prices.mean()

        result = {
            "average_price": (
                round(float(average), 2)
                if pd.notna(average)
                else None
            )
        }

    elif operation == "total_stock":
        if "stock" not in columns:
            raise ValueError("The dataset needs a stock column.")

        stock_column = columns["stock"]
        columns_used = [str(stock_column)]

        stock = pd.to_numeric(df[stock_column], errors="coerce")

        result = {
            "total_stock": (
                int(stock.sum())
                if stock.notna().any()
                else None
            )
        }

    elif operation == "category_summary":
        if "category" not in columns:
            raise ValueError("The dataset needs a category column.")

        category_column = columns["category"]
        columns_used = [str(category_column)]

        summary = (
            df.groupby(category_column, dropna=False)
            .size()
            .reset_index(name="product_count")
        )

        result = summary.to_dict(orient="records")

    elif operation == "top_products_by_stock":
        if "product" not in columns or "stock" not in columns:
            raise ValueError(
                "The dataset needs product and stock columns."
            )

        product_column = columns["product"]
        stock_column = columns["stock"]
        columns_used = [str(product_column), str(stock_column)]

        limit = parameters["limit"]
        offset = parameters["offset"]

        working_df = df[
            [product_column, stock_column]
        ].copy()

        working_df[stock_column] = pd.to_numeric(
            working_df[stock_column],
            errors="coerce",
        )

        # Retain products with unknown stock and place them last.
        # Stable sorting preserves their original relative order.
        working_df = working_df.sort_values(
            by=stock_column,
            ascending=False,
            kind="mergesort",
            na_position="last",
        )

        result_df = working_df.iloc[offset:offset + limit].copy()

        # Convert missing stock values to JSON-safe None.
        result_df[stock_column] = (
            result_df[stock_column]
            .astype(object)
            .where(result_df[stock_column].notna(), None)
        )

        result = result_df.to_dict(orient="records")

    else:
        raise ValueError("Unsupported operation.")

    return {
        "success": True,
        "operation": operation,
        "result": result,
        "evidence": {
            "dataset_id": dataset_id,
            "dataset_version": dataset_version,
            "columns_used": columns_used,
            "filters": [],
            "operations": [operation],
            "input_row_count": int(len(df)),
            "result_preview": (
                result[:5] if isinstance(result, list) else result
            ),
        },
    }
