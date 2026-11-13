
import pandas as pd


def generate_retail_analytics(df: pd.DataFrame) -> dict:
    """
    Generate basic retail analytics from a cleaned retail dataset.

    Supported columns:
    - product
    - category
    - price
    - stock
    """

    if df.empty:
        raise ValueError("Cannot generate analytics from an empty dataset.")

    required_columns = {"product", "category", "price", "stock"}
    available_columns = {column.lower() for column in df.columns}

    missing_columns = required_columns - available_columns

    if missing_columns:
        raise ValueError(
            f"Missing required retail columns: {', '.join(sorted(missing_columns))}"
        )

    # Work on a copy so the original dataset is never modified.
    data = df.copy()
    data.columns = [column.lower().strip() for column in data.columns]

    data["price"] = pd.to_numeric(data["price"], errors="coerce")
    data["stock"] = pd.to_numeric(data["stock"], errors="coerce")

    valid_prices = data["price"].dropna()
    valid_stock = data["stock"].dropna()

    category_summary = (
        data.groupby("category", dropna=False)
        .agg(
            product_count=("product", "count"),
            average_price=("price", "mean"),
            total_stock=("stock", "sum"),
        )
        .reset_index()
    )

    category_summary = category_summary.fillna(0)

    top_products = (
        data.groupby("product", dropna=False)
        .agg(
            price=("price", "mean"),
            stock=("stock", "sum"),
        )
        .reset_index()
        .sort_values("stock", ascending=False)
        .head(5)
    )

    return {
        "summary": {
            "total_products": int(data["product"].nunique()),
            "total_categories": int(data["category"].nunique()),
            "average_price": (
                round(float(valid_prices.mean()), 2)
                if not valid_prices.empty else None
            ),
            "total_inventory_units": (
                round(float(valid_stock.sum()), 2)
                if not valid_stock.empty else 0
            ),
            "total_inventory_value": (
                round(float((data["price"] * data["stock"]).sum()), 2)
            ),
            "products_with_missing_stock": int(data["stock"].isna().sum()),
        },
        "category_summary": category_summary.to_dict(orient="records"),
        "top_products_by_stock": top_products.fillna("").to_dict(
            orient="records"
        ),
    }
