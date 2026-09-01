from datetime import datetime

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)
from sqlalchemy.orm import Session
import tempfile
import os
import pandas as pd

from database.connection import get_db
from models.recipient import Recipient
from models.master import (
    Language,
    State,
    Occupation,
    Organization,
    OrganizationUnit
)
from services.import_service import (
    read_import_file,
    validate_columns,
    validate_rows,
    clean_value
)
from services.auth_service import get_current_admin


router = APIRouter(
    prefix="/recipients/import",
    tags=["Recipient Import"]
)


# =========================================================
# MASTER DATA HELPERS
# =========================================================

def find_master_id(
    db: Session,
    model,
    value,
    field_name: str
):
    """
    Accept either a numeric ID or a master-data name.
    """

    value = clean_value(value)

    if value is None:
        return None

    # If the value is numeric, treat it as an ID
    if value.isdigit():
        record = (
            db.query(model)
            .filter(model.id == int(value))
            .first()
        )

        if not record:
            raise ValueError(
                f"{field_name} ID '{value}' was not found"
            )

        return record.id

    # Otherwise match by name
    record = (
        db.query(model)
        .filter(model.name.ilike(value))
        .first()
    )

    if not record:
        raise ValueError(
            f"{field_name} '{value}' was not found"
        )

    return record.id


def find_organization_unit_id(
    db: Session,
    value,
    organization_id=None
):
    """
    Resolve department / organization unit by name or ID.

    If organization_id is supplied, the unit must belong
    to that organization.
    """

    value = clean_value(value)

    if value is None:
        return None

    query = db.query(OrganizationUnit)

    if value.isdigit():
        query = query.filter(
            OrganizationUnit.id == int(value)
        )
    else:
        query = query.filter(
            OrganizationUnit.name.ilike(value)
        )

    if organization_id is not None:
        query = query.filter(
            OrganizationUnit.organization_id
            == organization_id
        )

    unit = query.first()

    if not unit:
        raise ValueError(
            f"Organization unit '{value}' was not found"
        )

    return unit.id


# =========================================================
# PREVIEW
# =========================================================

@router.post("/preview")
async def preview_import(
    file: UploadFile = File(...)
):
    filename = file.filename or ""

    if not filename.lower().endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and XLSX files are supported"
        )

    contents = await file.read()
    temp_path = None

    try:
        suffix = (
            ".xlsx"
            if filename.lower().endswith(".xlsx")
            else ".csv"
        )

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:
            temp_file.write(contents)
            temp_path = temp_file.name

        df = read_import_file(temp_path)

        column_validation = validate_columns(df)

        if not column_validation["valid"]:
            return {
                "valid": False,
                "filename": filename,
                "total_rows": len(df),
                "validation": column_validation,
                "errors": []
            }

        row_errors = validate_rows(df)

        return {
            "valid": len(row_errors) == 0,
            "filename": filename,
            "total_rows": len(df),
            "columns": list(df.columns),
            "error_count": len(row_errors),
            "errors": row_errors[:100],
            "preview": (
                df.head(10)
                .fillna("")
                .to_dict(orient="records")
            )
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process file: {str(e)}"
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


# =========================================================
# ACTUAL IMPORT - ADMIN ONLY
# =========================================================

@router.post("/")
async def import_recipients(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    filename = file.filename or ""

    if not filename.lower().endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and XLSX files are supported"
        )

    contents = await file.read()
    temp_path = None

    try:
        suffix = (
            ".xlsx"
            if filename.lower().endswith(".xlsx")
            else ".csv"
        )

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:
            temp_file.write(contents)
            temp_path = temp_file.name

        df = read_import_file(temp_path)

        # -------------------------------------------------
        # COLUMN VALIDATION
        # -------------------------------------------------

        column_validation = validate_columns(df)

        if not column_validation["valid"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Required columns are missing",
                    "validation": column_validation
                }
            )

        # -------------------------------------------------
        # ROW VALIDATION
        # -------------------------------------------------

        row_errors = validate_rows(df)

        if row_errors:
            return {
                "success": False,
                "message": (
                    "Import failed because "
                    "validation errors were found"
                ),
                "total_rows": len(df),
                "error_count": len(row_errors),
                "errors": row_errors[:100],
                "imported_count": 0
            }

        imported_count = 0
        duplicate_count = 0
        duplicates = []
        import_errors = []

        # -------------------------------------------------
        # PROCESS EACH ROW
        # -------------------------------------------------

        for index, row in df.iterrows():

            row_number = index + 2

            try:
                external_reference_id = clean_value(
                    row["external_reference_id"]
                )

                email = clean_value(
                    row["email"]
                )

                first_name = clean_value(
                    row["first_name"]
                )

                last_name = clean_value(
                    row.get("last_name")
                )

                phone_number = clean_value(
                    row.get("phone_number")
                )

                gender = clean_value(
                    row.get("gender")
                )

                city = clean_value(
                    row.get("city")
                )

                pincode = clean_value(
                    row.get("pincode")
                )

                timezone = clean_value(
                    row.get("timezone")
                )

                status = (
                    clean_value(row.get("status"))
                    or "active"
                )

                consent_status = (
                    clean_value(
                        row.get("consent_status")
                    )
                    or "pending"
                )

                # -------------------------------------------------
                # ORGANIZATION
                # -------------------------------------------------

                organization_value = row.get(
                    "organization"
                )

                if pd.isna(organization_value):
                    organization_value = row.get(
                        "organization_id"
                    )

                organization_id = find_master_id(
                    db,
                    Organization,
                    organization_value,
                    "Organization"
                )

                # -------------------------------------------------
                # LANGUAGE
                # -------------------------------------------------

                language_value = row.get(
                    "language"
                )

                if pd.isna(language_value):
                    language_value = row.get(
                        "preferred_language_id"
                    )

                preferred_language_id = find_master_id(
                    db,
                    Language,
                    language_value,
                    "Language"
                )

                # -------------------------------------------------
                # STATE
                # -------------------------------------------------

                state_value = row.get("state")

                if pd.isna(state_value):
                    state_value = row.get("state_id")

                state_id = find_master_id(
                    db,
                    State,
                    state_value,
                    "State"
                )

                # -------------------------------------------------
                # OCCUPATION
                # -------------------------------------------------

                occupation_value = row.get(
                    "occupation"
                )

                if pd.isna(occupation_value):
                    occupation_value = row.get(
                        "occupation_id"
                    )

                occupation_id = find_master_id(
                    db,
                    Occupation,
                    occupation_value,
                    "Occupation"
                )

                # -------------------------------------------------
                # ORGANIZATION UNIT / DEPARTMENT
                # -------------------------------------------------

                department_value = row.get(
                    "department"
                )

                if pd.isna(department_value):
                    department_value = row.get(
                        "organization_unit_id"
                    )

                organization_unit_id = (
                    find_organization_unit_id(
                        db,
                        department_value,
                        organization_id
                    )
                )

                # -------------------------------------------------
                # DUPLICATE CHECK
                # -------------------------------------------------

                existing = (
                    db.query(Recipient)
                    .filter(
                        Recipient.external_reference_id
                        == external_reference_id
                    )
                    .first()
                )

                if existing:
                    duplicate_count += 1

                    duplicates.append({
                        "row": row_number,
                        "external_reference_id":
                            external_reference_id,
                        "reason":
                            "external_reference_id already exists"
                    })

                    continue

                if email:
                    existing_email = (
                        db.query(Recipient)
                        .filter(
                            Recipient.email == email
                        )
                        .first()
                    )

                    if existing_email:
                        duplicate_count += 1

                        duplicates.append({
                            "row": row_number,
                            "email": email,
                            "reason":
                                "email already exists"
                        })

                        continue

                # -------------------------------------------------
                # CREATE RECIPIENT
                # -------------------------------------------------

                recipient = Recipient(
                    external_reference_id=
                        external_reference_id,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone_number=phone_number,
                    gender=gender,
                    occupation_id=occupation_id,
                    organization_id=organization_id,
                    organization_unit_id=
                        organization_unit_id,
                    state_id=state_id,
                    city=city,
                    pincode=pincode,
                    preferred_language_id=
                        preferred_language_id,
                    timezone=timezone,
                    status=status,
                    consent_status=consent_status,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )

                db.add(recipient)
                imported_count += 1

            except Exception as row_error:

                import_errors.append({
                    "row": row_number,
                    "error": str(row_error)
                })

        # -------------------------------------------------
        # COMMIT
        # -------------------------------------------------

        if import_errors:
            db.rollback()

            return {
                "success": False,
                "message": (
                    "Import failed because "
                    "some rows contain invalid data"
                ),
                "total_rows": len(df),
                "imported_count": 0,
                "duplicate_count": duplicate_count,
                "duplicates": duplicates[:100],
                "error_count": len(import_errors),
                "errors": import_errors[:100]
            }

        db.commit()

        return {
            "success": True,
            "message": "Import completed",
            "total_rows": len(df),
            "imported_count": imported_count,
            "duplicate_count": duplicate_count,
            "duplicates": duplicates[:100]
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Import failed: {str(e)}"
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)