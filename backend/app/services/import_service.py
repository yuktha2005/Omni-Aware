import pandas as pd


REQUIRED_COLUMNS = {
    "external_reference_id",
    "first_name",
    "email",
}


def read_import_file(file_path: str) -> pd.DataFrame:
    if file_path.lower().endswith(".csv"):
        return pd.read_csv(file_path)

    if file_path.lower().endswith(".xlsx"):
        return pd.read_excel(file_path)

    raise ValueError(
        "Unsupported file format. Please upload CSV or XLSX."
    )


def validate_columns(df: pd.DataFrame):
    columns = set(df.columns)

    missing_columns = REQUIRED_COLUMNS - columns

    return {
        "valid": len(missing_columns) == 0,
        "missing_columns": sorted(missing_columns),
        "columns": list(df.columns),
    }


def validate_rows(df: pd.DataFrame):
    errors = []

    for index, row in df.iterrows():
        row_number = index + 2

        if pd.isna(row.get("external_reference_id")):
            errors.append({
                "row": row_number,
                "field": "external_reference_id",
                "error": "External reference ID is required"
            })

        if pd.isna(row.get("first_name")):
            errors.append({
                "row": row_number,
                "field": "first_name",
                "error": "First name is required"
            })

        if pd.isna(row.get("email")):
            errors.append({
                "row": row_number,
                "field": "email",
                "error": "Email is required"
            })

    return errors


def clean_value(value):
    if pd.isna(value):
        return None

    value = str(value).strip()

    if not value:
        return None

    return value