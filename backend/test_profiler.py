
import pandas as pd
from app.services.profiler import profile_dataframe


def test_profile_dataframe():
    df = pd.DataFrame({
        "product": ["Laptop", "Phone", "Laptop"],
        "price": [50000, 20000, 50000],
        "stock": [10, None, 10]
    })

    result = profile_dataframe(df)

    assert result["overview"]["total_rows"] == 3
    assert result["overview"]["total_columns"] == 3
    assert result["overview"]["duplicate_rows"] == 1
    assert result["overview"]["missing_cells"] == 1

    assert len(result["columns"]) == 3
