from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.crm import Task, TimeLog, TaskStatus, TaskPriority
from models.user import User
from schemas.crm import TaskCreate, TaskUpdate, TaskOut, TimeLogCreate, TimeLogOut

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _get_task_or_404(task_id: int, db: Session) -> Task:
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    return t


@router.get("", response_model=List[TaskOut])
def list_tasks(
    order_id: Optional[int] = Query(None),
    assigned_to_id: Optional[int] = Query(None),
    task_status: Optional[TaskStatus] = Query(None, alias="status"),
    priority: Optional[TaskPriority] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Task)
    if not current_user.is_admin:
        q = q.filter(Task.assigned_to_id == current_user.id)
    if order_id:
        q = q.filter(Task.order_id == order_id)
    if assigned_to_id:
        q = q.filter(Task.assigned_to_id == assigned_to_id)
    if task_status:
        q = q.filter(Task.status == task_status)
    if priority:
        q = q.filter(Task.priority == priority)
    return q.order_by(Task.created_at.desc()).all()


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    task = Task(**data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = _get_task_or_404(task_id, db)
    if not current_user.is_admin and t.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    return t


@router.put("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = _get_task_or_404(task_id, db)
    if not current_user.is_admin and t.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    t = _get_task_or_404(task_id, db)
    db.delete(t)
    db.commit()


@router.get("/{task_id}/time-logs", response_model=List[TimeLogOut])
def list_time_logs(task_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    _get_task_or_404(task_id, db)
    return db.query(TimeLog).filter(TimeLog.task_id == task_id).order_by(TimeLog.logged_at.desc()).all()


@router.post("/{task_id}/time-logs", response_model=TimeLogOut, status_code=status.HTTP_201_CREATED)
def log_time(task_id: int, data: TimeLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = _get_task_or_404(task_id, db)
    if not current_user.is_admin and t.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    log = TimeLog(task_id=task_id, user_id=current_user.id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
