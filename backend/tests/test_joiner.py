
import pandas as pd
import pytest

from app.services.joiner import join_retail_datasets


@pytest.fixture
def retail_datasets():
    left_df = pd.DataFrame({
        "product_id": [1, 2, 3],
        "product": ["Laptop", "Phone", "Shoes"],
    })

    right_df = pd.DataFrame({
        "product_id": [1, 2, 4],
        "warehouse": ["Kolkata", "Howrah", "Bangalore"],
    })

    return left_df, right_df


def test_inner_join(retail_datasets):
    left_df, right_df = retail_datasets

    result, report = join_retail_datasets(
        left_df, right_df, "product_id", "inner"
    )

    assert len(result) == 2
    assert result["product"].tolist() == ["Laptop", "Phone"]
    assert report["join_type"] == "inner"
    assert report["result_rows"] == 2


def test_left_join(retail_datasets):
    left_df, right_df = retail_datasets

    result, report = join_retail_datasets(
        left_df, right_df, "product_id", "left"
    )

    assert len(result) == 3
    assert report["result_rows"] == 3
    assert pd.isna(result.loc[2, "warehouse"])


def test_outer_join(retail_datasets):
    left_df, right_df = retail_datasets

    result, report = join_retail_datasets(
        left_df, right_df, "product_id", "outer"
    )

    assert len(result) == 4
    assert report["result_rows"] == 4


def test_duplicate_join_keys_are_rejected():
    left_df = pd.DataFrame({
        "product_id": [1, 1],
        "product": ["Laptop", "Phone"],
    })

    right_df = pd.DataFrame({
        "product_id": [1, 2],
        "warehouse": ["Kolkata", "Howrah"],
    })

    with pytest.raises(ValueError, match="Duplicate join keys"):
        join_retail_datasets(left_df, right_df, "product_id")


def test_missing_join_key_is_rejected(retail_datasets):
    left_df, right_df = retail_datasets

    with pytest.raises(ValueError, match="missing from the first dataset"):
        join_retail_datasets(left_df, right_df, "missing_id")


def test_empty_dataset_is_rejected():
    left_df = pd.DataFrame()
    right_df = pd.DataFrame({"product_id": [1]})

    with pytest.raises(ValueError, match="Both datasets must contain data"):
        join_retail_datasets(left_df, right_df, "product_id")


def test_invalid_join_type_is_rejected(retail_datasets):
    left_df, right_df = retail_datasets

    with pytest.raises(ValueError, match="Unsupported join type"):
        join_retail_datasets(left_df, right_df, "product_id", "cross")


def test_join_report_contains_metadata(retail_datasets):
    left_df, right_df = retail_datasets

    _, report = join_retail_datasets(
        left_df, right_df, "product_id", "inner"
    )

    assert report["join_key"] == "product_id"
    assert report["left_rows"] == 3
    assert report["right_rows"] == 3
    assert report["left_duplicate_keys"] == 0
    assert report["right_duplicate_keys"] == 0

