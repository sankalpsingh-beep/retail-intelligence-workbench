
import pandas as pd
import pytest

from app.services.normalizer import normalize_retail_data


def test_normalize_product_whitespace():
    df = pd.DataFrame({
        "product": ["  gaming   laptop  ", "  Smart   Phone "],
        "category": ["Electronics", "Electronics"],
    })

    normalized, actions = normalize_retail_data(df)

    assert normalized["product"].tolist() == [
        "gaming laptop",
        "Smart Phone",
    ]
    assert actions[0]["rows_affected"] == 2


def test_normalize_category_aliases():
    df = pd.DataFrame({
        "product": ["Laptop", "Shoes", "T-shirt"],
        "category": ["electronic", "shoes", "clothing"],
    })

    normalized, actions = normalize_retail_data(df)

    assert normalized["category"].tolist() == [
        "Electronics",
        "Footwear",
        "Apparel",
    ]
    assert actions[1]["rows_affected"] == 3


def test_normalize_unknown_category():
    df = pd.DataFrame({
        "product": ["Chair"],
        "category": ["  home   decor  "],
    })

    normalized, _ = normalize_retail_data(df)

    assert normalized["category"].iloc[0] == "Home Decor"


def test_original_dataframe_is_not_modified():
    df = pd.DataFrame({
        "product": ["  Laptop  "],
        "category": ["electronics"],
    })

    original = df.copy(deep=True)

    normalize_retail_data(df)

    pd.testing.assert_frame_equal(df, original)


def test_empty_dataframe_is_rejected():
    df = pd.DataFrame(columns=["product", "category"])

    with pytest.raises(ValueError, match="empty dataset"):
        normalize_retail_data(df)


def test_missing_required_columns_are_rejected():
    df = pd.DataFrame({
        "product": ["Laptop"],
        "price": [50000],
    })

    with pytest.raises(ValueError, match="product.*category"):
        normalize_retail_data(df)
