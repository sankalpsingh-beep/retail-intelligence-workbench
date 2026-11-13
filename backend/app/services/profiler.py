
import pandas as pd


def profile_dataframe(df: pd.DataFrame) -> dict:
    """Generate a data quality report for a dataframe."""

    if df.empty and len(df.columns) == 0:
        raise ValueError("The uploaded dataset is empty.")

    columns = []

    for column in df.columns:
        series = df[column]

        missing_count = int(series.isna().sum())
        duplicate_values = int(series.dropna().duplicated().sum())

        column_info = {
            "name": str(column),
            "data_type": str(series.dtype),
            "total_values": int(len(series)),
            "missing_values": missing_count,
            "missing_percentage": round(
                missing_count / len(df) * 100, 2
            ) if len(df) else 0,
            "unique_values": int(series.nunique()),
            "duplicate_values": duplicate_values,
        }

        if pd.api.types.is_numeric_dtype(series):
            column_info["statistics"] = {
                "minimum": _safe_number(series.min()),
                "maximum": _safe_number(series.max()),
                "mean": _safe_number(series.mean()),
            }

        columns.append(column_info)

    duplicate_rows = int(df.duplicated().sum())

    return {
        "overview": {
            "total_rows": int(len(df)),
            "total_columns": int(len(df.columns)),
            "duplicate_rows": duplicate_rows,
            "missing_cells": int(df.isna().sum().sum()),
            "total_cells": int(df.size),
        },
        "columns": columns,
        "sample_data": df.head(5).astype(object).where(
    pd.notna(df.head(5)), ""
).to_dict(orient="records"),
    }


def _safe_number(value):
    """Convert pandas numeric values into JSON-safe values."""
    if pd.isna(value):
        return None
    return float(value)
