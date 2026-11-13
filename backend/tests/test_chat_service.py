
import pandas as pd
import pytest

from app.services.chat_service import (
    UnsupportedQuestionError,
    build_query_plan,
    validate_query_plan,
    execute_query_plan,
)


@pytest.fixture
def retail_dataframe():
    return pd.DataFrame({
        "product": ["Laptop", "Phone", "Shoes"],
        "category": ["Electronics", "Electronics", "Footwear"],
        "price": [55000, 25000, 3000],
        "stock": [10, None, 25],
    })


def test_build_product_count_plan():
    plan = build_query_plan("How many products are there?")
    assert plan["operation"] == "count_products"


def test_build_average_price_plan():
    plan = build_query_plan("What is the average price?")
    assert plan["operation"] == "average_price"


def test_build_total_stock_plan():
    plan = build_query_plan("What is the total stock?")
    assert plan["operation"] == "total_stock"


def test_build_category_summary_plan():
    plan = build_query_plan("Show me the category breakdown")
    assert plan["operation"] == "category_summary"


def test_build_top_products_plan():
    plan = build_query_plan("Show me the top 2 products by stock")
    assert plan["operation"] == "top_products_by_stock"
    assert plan["parameters"]["limit"] == 2


def test_unsupported_question_is_refused():
    with pytest.raises(UnsupportedQuestionError):
        build_query_plan("What will my sales be next year?")


def test_invalid_operation_is_rejected():
    with pytest.raises(ValueError):
        validate_query_plan({
            "operation": "delete_dataset",
            "parameters": {},
        })


def test_average_price_execution(retail_dataframe):
    plan = build_query_plan("What is the average price?")
    result = execute_query_plan(
        retail_dataframe,
        plan,
        "test-dataset",
        "cleaned",
    )

    assert result["result"]["average_price"] == 27666.67


def test_total_stock_execution(retail_dataframe):
    plan = build_query_plan("What is the total stock?")
    result = execute_query_plan(
        retail_dataframe,
        plan,
        "test-dataset",
        "cleaned",
    )

    assert result["result"]["total_stock"] == 35


def test_top_products_execution(retail_dataframe):
    plan = build_query_plan("Show me the top 2 products by stock")
    result = execute_query_plan(
        retail_dataframe,
        plan,
        "test-dataset",
        "cleaned",
    )

    assert result["result"] == [
        {"product": "Shoes", "stock": 25},
        {"product": "Laptop", "stock": 10},
    ]


def test_evidence_is_generated(retail_dataframe):
    plan = build_query_plan("Show me the top 2 products by stock")
    result = execute_query_plan(
        retail_dataframe,
        plan,
        "test-dataset",
        "cleaned",
    )

    evidence = result["evidence"]

    assert evidence["dataset_id"] == "test-dataset"
    assert evidence["dataset_version"] == "cleaned"
    assert evidence["input_row_count"] == 3
    assert "stock" in evidence["columns_used"]
