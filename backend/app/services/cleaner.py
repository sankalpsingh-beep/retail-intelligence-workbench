
import pandas as pd


def detect_issues(df: pd.DataFrame) -> list[dict]:
    """Detect common data quality issues without modifying the data."""

    issues = []

    for column in df.columns:
        missing_count = int(df[column].isna().sum())

        if missing_count:
            issues.append({
                "issue_id": f"missing_{column}",
                "issue_type": "missing_values",
                "column": str(column),
                "count": missing_count,
                "risk": "medium",
                "reason": (
                    f"{missing_count} values are missing in '{column}'."
                ),
                "suggested_action": (
                    "Review and fill or remove missing values."
                )
            })

    duplicate_count = int(df.duplicated().sum())

    if duplicate_count:
        issues.append({
            "issue_id": "duplicate_rows",
            "issue_type": "duplicate_rows",
            "column": None,
            "count": duplicate_count,
            "risk": "medium",
            "reason": "Identical rows were found in the dataset.",
            "suggested_action": "Remove exact duplicate rows."
        })

    return issues


def clean_dataframe(
    df: pd.DataFrame,
    selected_issue_ids: list[str]
) -> tuple[pd.DataFrame, list[dict]]:
    """Apply explicitly selected, deterministic cleaning actions."""

    cleaned = df.copy()
    applied_actions = []

    available_issues = {
        issue["issue_id"]: issue
        for issue in detect_issues(cleaned)
    }

    unknown_ids = set(selected_issue_ids) - set(available_issues)

    if unknown_ids:
        raise ValueError(
            f"Unknown cleaning issue IDs: "
            f"{', '.join(sorted(unknown_ids))}"
        )

    for issue_id in selected_issue_ids:
        issue = available_issues[issue_id]

        if issue["issue_type"] == "missing_values":
            column = issue["column"]

            cleaned[column] = cleaned[column].astype(object).where(
                cleaned[column].notna(), ""
            )

            applied_actions.append({
                "issue_id": issue_id,
                "action": "fill_missing_with_empty_string",
                "rows_affected": issue["count"]
            })

        elif issue["issue_type"] == "duplicate_rows":
            before_count = len(cleaned)

            cleaned = cleaned.drop_duplicates().reset_index(drop=True)

            applied_actions.append({
                "issue_id": issue_id,
                "action": "remove_exact_duplicate_rows",
                "rows_affected": before_count - len(cleaned)
            })

    return cleaned, applied_actions
