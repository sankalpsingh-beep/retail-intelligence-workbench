
import pandas as pd


CATEGORY_ALIASES = {
    "electronics": "Electronics",
    "electronic": "Electronics",
    "footwear": "Footwear",
    "shoes": "Footwear",
    "apparel": "Apparel",
    "clothing": "Apparel",
    "grocery": "Grocery",
    "groceries": "Grocery",
    "furniture": "Furniture",
    "beauty": "Beauty",
}


def normalize_retail_data(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    """
    Normalize product names and category labels without
    changing the original dataframe.
    """

    if df.empty:
        raise ValueError("Cannot normalize an empty dataset.")

    normalized = df.copy()

    # Find supported columns without depending on capitalization.
    column_lookup = {
        str(column).strip().lower(): column
        for column in normalized.columns
    }

    if "product" not in column_lookup or "category" not in column_lookup:
        raise ValueError(
            "Dataset must contain 'product' and 'category' columns."
        )

    product_column = column_lookup["product"]
    category_column = column_lookup["category"]

    actions = []

    # Clean extra spaces in product names.
    original_products = normalized[product_column].copy()

    normalized[product_column] = (
        normalized[product_column]
        .astype("string")
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )

    product_changes = int(
        original_products.fillna("").ne(
            normalized[product_column].fillna("")
        ).sum()
    )

    actions.append({
        "column": str(product_column),
        "action": "trim_and_collapse_product_whitespace",
        "rows_affected": product_changes
    })

    # Standardize known category names and aliases.
    original_categories = normalized[category_column].copy()

    def standardize_category(value):
        if pd.isna(value):
            return value

        cleaned = " ".join(str(value).strip().split())

        if not cleaned:
            return cleaned

        return CATEGORY_ALIASES.get(
            cleaned.lower(),
            cleaned.title()
        )

    normalized[category_column] = (
        normalized[category_column].apply(standardize_category)
    )

    category_changes = int(
        original_categories.fillna("").ne(
            normalized[category_column].fillna("")
        ).sum()
    )

    actions.append({
        "column": str(category_column),
        "action": "standardize_category_names",
        "rows_affected": category_changes
    })

    return normalized, actions
