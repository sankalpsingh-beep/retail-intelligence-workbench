import pandas as pd
import pytest

from app.services.cleaner import detect_issues, clean_dataframe


def test_detect_issues():
    df = pd.DataFrame({
        "product": ["Laptop", "Phone", "Laptop"],
        "price": [50000, 20000, 50000],
        "stock": [10, None, 10]
    })

    issues = detect_issues(df)
    issue_ids = {issue["issue_id"] for issue in issues}

    assert "missing_stock" in issue_ids
    assert "duplicate_rows" in issue_ids


def test_clean_dataframe():
    df = pd.DataFrame({
        "product": ["Laptop", "Phone", "Laptop"],
        "price": [50000, 20000, 50000],
        "stock": [10, None, 10]
    })

    cleaned, actions = clean_dataframe(
        df,
        ["missing_stock", "duplicate_rows"]
    )

    assert len(cleaned) == 2
    assert cleaned["stock"].isna().sum() == 0
    assert len(actions) == 2


def test_unknown_issue_is_rejected():
    df = pd.DataFrame({"product": ["Laptop"]})

    with pytest.raises(ValueError):
        clean_dataframe(df, ["unknown_issue"])