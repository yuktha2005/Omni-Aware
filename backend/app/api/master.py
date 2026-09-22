from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from models.master import (
    Language,
    State,
    Occupation,
    Organization,
    OrganizationUnit
)

router = APIRouter(
    prefix="/master",
    tags=["Master Data"]
)


def _serialize(obj):
    result = {"id": obj.id}
    for col in obj.__table__.columns:
        if col.name != "id":
            result[col.name] = getattr(obj, col.name)
    return result


@router.get("/languages")
def get_languages(db: Session = Depends(get_db)):
    records = db.query(Language).order_by(Language.id).all()
    return [_serialize(r) for r in records]


@router.get("/states")
def get_states(db: Session = Depends(get_db)):
    records = db.query(State).order_by(State.id).all()
    return [_serialize(r) for r in records]


@router.get("/occupations")
def get_occupations(db: Session = Depends(get_db)):
    records = db.query(Occupation).order_by(Occupation.id).all()
    return [_serialize(r) for r in records]


@router.get("/organizations")
def get_organizations(db: Session = Depends(get_db)):
    records = db.query(Organization).order_by(Organization.id).all()
    return [_serialize(r) for r in records]


@router.get("/organization-units")
def get_organization_units(db: Session = Depends(get_db)):
    records = db.query(OrganizationUnit).order_by(OrganizationUnit.id).all()
    return [_serialize(r) for r in records]
