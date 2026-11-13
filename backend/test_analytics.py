
import pandas as pd
import pytest

from app.services.analytics import generate_retail_analytics


def test_generate_retail_analytics():
    df = pd.DataFrame({
        "product": ["Laptop", "Phone", "Shoes"],
        "category": ["Electronics", "Electronics", "Footwear"],
        "price": [55000, 25000, 3000],
        "stock": [10, None, 25],
    })

    result = generate_retail_analytics(df)

    assert result["summary"]["total_products"] == 3
    assert result["summary"]["total_categories"] == 2
    assert result["summary"]["average_price"] == pytest.approx(27666.67)
    assert result["summary"]["total_inventory_units"] == 35
    assert result["summary"]["products_with_missing_stock"] == 1


def test_empty_dataset_is_rejected():
    df = pd.DataFrame(columns=["product", "category", "price", "stock"])

    with pytest.raises(ValueError):
        generate_retail_analytics(df)
