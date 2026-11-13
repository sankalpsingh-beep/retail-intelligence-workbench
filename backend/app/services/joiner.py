
import pandas as pd


def join_retail_datasets(
    left_df: pd.DataFrame,
    right_df: pd.DataFrame,
    join_key: str,
    how: str = "inner"
) -> tuple[pd.DataFrame, dict]:
    """
    Join two retail datasets using an explicitly selected common key.
    """

    allowed_join_types = {"inner", "left", "right", "outer"}

    if how not in allowed_join_types:
        raise ValueError(
            f"Unsupported join type. Choose from: "
            f"{', '.join(sorted(allowed_join_types))}"
        )

    if left_df.empty or right_df.empty:
        raise ValueError("Both datasets must contain data.")

    if not join_key or not join_key.strip():
        raise ValueError("A join key must be provided.")

    if join_key not in left_df.columns:
        raise ValueError(
            f"Join key '{join_key}' is missing from the first dataset."
        )

    if join_key not in right_df.columns:
        raise ValueError(
            f"Join key '{join_key}' is missing from the second dataset."
        )

    # Avoid accidental many-to-many row multiplication.
    left_key = left_df[join_key].dropna()
    right_key = right_df[join_key].dropna()

    left_duplicates = int(left_key.duplicated().sum())
    right_duplicates = int(right_key.duplicated().sum())

    if left_duplicates or right_duplicates:
        raise ValueError(
            "Duplicate join keys detected. "
            "Resolve duplicates before joining to avoid "
            "unexpected row multiplication."
        )

    joined_df = pd.merge(
        left_df,
        right_df,
        on=join_key,
        how=how,
        validate="one_to_one",
        suffixes=("_left", "_right")
    )

    report = {
        "join_key": join_key,
        "join_type": how,
        "left_rows": int(len(left_df)),
        "right_rows": int(len(right_df)),
        "result_rows": int(len(joined_df)),
        "result_columns": int(len(joined_df.columns)),
        "left_duplicate_keys": left_duplicates,
        "right_duplicate_keys": right_duplicates,
    }

    return joined_df, report
