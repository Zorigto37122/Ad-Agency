import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.client import Client
from models.user import User
from schemas.client import ClientCreate, ClientUpdate, ClientOut, ClientDetail
from schemas.order import OrderOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("", response_model=List[ClientOut])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clients = db.query(Client).order_by(Client.name).all()
    result = []
    for c in clients:
        out = ClientOut.model_validate(c)
        out.order_count = len(c.orders)
        result.append(out)
    return result


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if db.query(Client).filter(Client.email == client_in.email).first():
        raise HTTPException(status_code=400, detail="Client with this email already exists")
    client = Client(**client_in.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    logger.info(f"Client created: {client.name}")
    out = ClientOut.model_validate(client)
    out.order_count = 0
    return out


@router.get("/{client_id}", response_model=ClientDetail)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    out = ClientDetail.model_validate(client)
    out.order_count = len(client.orders)
    out.orders = [OrderOut.model_validate(o) for o in sorted(client.orders, key=lambda x: x.created_at, reverse=True)]
    return out


@router.put("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for field, value in client_in.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    out = ClientOut.model_validate(client)
    out.order_count = len(client.orders)
    return out


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    logger.info(f"Client deleted: {client_id}")
