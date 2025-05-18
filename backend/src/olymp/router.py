from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import func, select, insert, delete, update, cast, Float
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from pathlib import Path
import aiofiles
from sqlalchemy.exc import IntegrityError
import os
import shutil
from io import BytesIO
from auth.database import get_async_session
from pydantic import BaseModel
from typing import List, Dict
from auth.models import User
from auth.users import current_active_user, current_superuser
from auth.schemas import RoleRead
from olymp.schemas import OlympCreate, OlympRead, OlympReadWithCount, OlympUpdate,TasksRate, TaskRead, TaskCreate, TaskUpdate, TaskReadAttach, TaskAttachmentRead, AssignmentRequestItem, AnswerAttachmentRead, AnswerReadAttach,AnswerReadAttachWithRate, TaskReadWithAnswer, CheckedAnswersWithOwnRate,TotalOrgRating, LocalRating, ExpertRateForParticipant
from olymp.models import TeamMembers, Answer, AnswerAttachment, Olymp, Task, TaskAttachment, ExpertTaskAssignment, RegisteredOlymp, RateAnswer
from auth.users import get_user_or_admingeneral, get_expert_or_org, get_adm_or_expert_or_org
from datetime import datetime, timezone
from olymp.methods import delete_task_and_attachments, add_attachments, add_ans_attachments
from fastapi.responses import FileResponse, StreamingResponse
import pathlib
from starlette.responses import Response
import urllib.parse
from tempfile import NamedTemporaryFile
from openpyxl import Workbook
from openpyxl.styles import Alignment


router = APIRouter(
    prefix="/olymp",
    tags=["Olymps"]
)

@router.post("/create")
async def create_olymp(
    new_olymp:OlympCreate, user: User = Depends(get_user_or_admingeneral),
    session: AsyncSession = Depends(get_async_session)):
    new_olymp.to_utc()
    db_olymp = Olymp(**new_olymp.dict())
    session.add(db_olymp)
    await session.commit()
    await session.refresh(db_olymp)
    return db_olymp

@router.get("/all", response_model=List[OlympReadWithCount])
async def get_olymps(
     user: User = Depends(get_user_or_admingeneral),
    session: AsyncSession = Depends(get_async_session)):
    # result = await session.execute(select(Olymp))
    # olymps = result.scalars().all()
    # return olymps
    result = await session.execute(
        select(
            Olymp.id,
            Olymp.name,
            Olymp.description,
            Olymp.is_active,
            Olymp.start_date,
            Olymp.end_date,
            func.count(RegisteredOlymp.user_id).label("count"),
        )
        .join(RegisteredOlymp, Olymp.id == RegisteredOlymp.olymp_id, isouter=True)
        .group_by(Olymp.id)
    )
    # Преобразуем результаты в ожидаемую схему
    olymps = [
        OlympReadWithCount(
            id=row.id,
            name=row.name,
            description=row.description,
            is_active=row.is_active,
            start_date=row.start_date,
            end_date=row.end_date,
            count=row.count,
        )
        for row in result
    ]
    return olymps
@router.get("/active", response_model=List[OlympRead])
async def get_active_olymp(session: AsyncSession = Depends(get_async_session)):
    query = select(Olymp).where(Olymp.is_active == True)
    result = await session.execute(query)
    olymps = result.scalars().all()
    return olymps
@router.delete("/{olymp_id}")
async def del_olymp( olymp_id:int, user: User = Depends(get_user_or_admingeneral),
 session: AsyncSession = Depends(get_async_session)):

    query_olymp = select(Olymp).where(Olymp.id == olymp_id)
    olymp = await session.execute(query_olymp)
    olymp_obj = olymp.scalars().first()

    if not olymp_obj:
        return {"status": "error", "message": "Олимпиада не найдена."}

    file_directory = Path(f"uploads/{olymp_id}")
    if file_directory.exists() and file_directory.is_dir():
        shutil.rmtree(file_directory)

    await session.delete(olymp_obj)
    await session.commit()

    return {"status": "success"}

@router.get("/member/{olymp_id}")
async def get_olymp( olymp_id:int, user: User = Depends(current_active_user),
 session: AsyncSession = Depends(get_async_session)):
    result = await session.execute(select(RegisteredOlymp).filter(RegisteredOlymp.user_id == user.id))
    registered_olymp = result.scalars().first()
    result = await session.execute(select(Olymp).filter(RegisteredOlymp.user_id == user.id))
    if registered_olymp is None or registered_olymp.olymp_id != olymp_id :
        raise HTTPException(status_code=403, detail="Нет доступа")

    query = select(Olymp).where(Olymp.id == olymp_id)
    result = await session.execute(query)
    olymp = result.scalar_one_or_none()

    if olymp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Olymp not found")

    if not olymp.is_active:
        raise HTTPException(status_code=403, detail="Нет доступа")
    return olymp

@router.post("/create")
async def create_olymp(
    new_olymp:OlympCreate, user: User = Depends(get_user_or_admingeneral),
    session: AsyncSession = Depends(get_async_session)):
    new_olymp.to_utc()
    db_olymp = Olymp(**new_olymp.dict())
    session.add(db_olymp)
    await session.commit()
    await session.refresh(db_olymp)
    return db_olymp

@router.get("/{olymp_id}")
async def get_olymp( olymp_id:int, user: User = Depends(get_user_or_admingeneral),
 session: AsyncSession = Depends(get_async_session)):
    query = select(Olymp).where(Olymp.id == olymp_id)
    result = await session.execute(query)
    olymp = result.scalar_one_or_none()

    if olymp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Олимпиада не найдена")

    return olymp

@router.delete("/{olymp_id}")
async def del_olymp( olymp_id:int, user: User = Depends(get_user_or_admingeneral),
 session: AsyncSession = Depends(get_async_session)):

    query_olymp = select(Olymp).where(Olymp.id == olymp_id)
    olymp = await session.execute(query_olymp)
    olymp_obj = olymp.scalars().first()

    if not olymp_obj:
        return {"status": "error", "message": "Олимпиада не найдена."}

    file_directory = Path(f"uploads/{olymp_id}")
    if file_directory.exists() and file_directory.is_dir():
        shutil.rmtree(file_directory)

    await session.delete(olymp_obj)
    await session.commit()

    return {"status": "success"}

@router.patch("/{olymp_id}")
async def update_olymp(
    olymp_id: int,
    updated_olymp:OlympUpdate, user: User = Depends(get_user_or_admingeneral),
    session: AsyncSession = Depends(get_async_session)):
    query = select(Olymp).where(Olymp.id == olymp_id)
    result = await session.execute(query)
    olymp = result.scalar_one_or_none()

    if olymp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Olymp not found") 
    updated_olymp.to_utc()
    update_data = updated_olymp.dict(exclude_unset=True)
    
    await session.execute(
        update(Olymp).where(Olymp.id == olymp_id).values(**update_data)
    )
    await session.commit()
    return {"status": "success"}


@router.get("/{olymp_id}/tasks", response_model=List[TaskReadAttach])
async def get_tasks(olymp_id: int, user: User = Depends(get_user_or_admingeneral),
 session: AsyncSession = Depends(get_async_session)):  
    result = await session.execute(select(Olymp).where(Olymp.id == olymp_id))
    olymp = result.scalars().one_or_none()
    if not olymp:
        raise HTTPException(status_code=404, detail="Олимпиада не найдена")
    tasks = await session.execute(
        select(Task).options(
            selectinload(Task.attachments)
        ).where(Task.olymp_id == olymp_id).order_by(Task.task_number)
    )
    tasks = tasks.scalars().all()
    return tasks

@router.get("/member/{olymp_id}/tasks", response_model=List[TaskReadWithAnswer])
async def get_tasks(olymp_id: int, user: User = Depends(current_active_user),
 session: AsyncSession = Depends(get_async_session)):
    now = datetime.utcnow()
    result = await session.execute(select(Olymp).where(Olymp.id == olymp_id))
    olymp = result.scalar_one_or_none()
    if not olymp:
        raise HTTPException(status_code=404, detail="Олимпиада не найдена")
    result = await session.execute(select(RegisteredOlymp).filter(RegisteredOlymp.user_id == user.id))
    registered_olymp = result.scalars().first()
    if registered_olymp.olymp_id != olymp_id :
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Недостаточно прав")
    if now < olymp.start_date:
        raise HTTPException(status_code=403, detail="Олимпиада еще не началась")
    tasks_with_answers = await session.execute(
        select(Task, Answer)
        .outerjoin(Answer, (Answer.task_id == Task.id) & (Answer.user_id == user.id))
        .options(
            selectinload(Task.attachments),
            selectinload(Answer.attachments)
        )
        .where(Task.olymp_id == olymp_id)
        .order_by(Task.task_number)
    )
    tasks_with_user_answers = []
    for task, answer in tasks_with_answers:
        task_data = TaskReadWithAnswer(
            id=task.id,
            olymp_id=task.olymp_id,
            task_number=task.task_number,
            title=task.title,
            content=task.content,
            weight = task.weight,
            attachments=[TaskAttachmentRead(**attachment.__dict__) for attachment in task.attachments],
            user_answer=None
        )
        if answer:
            task_data.user_answer = AnswerReadAttach(
                id=answer.id,
                task_id=answer.task_id,
                user_id=answer.user_id,
                content=answer.content,
                attachments=[AnswerAttachmentRead(**attachment.__dict__) for attachment in answer.attachments]
            )
        tasks_with_user_answers.append(task_data)
    return tasks_with_user_answers

@router.post("/{olymp_id}/tasks", response_model=TaskReadAttach)
async def create_task(
    olymp_id: int,
    title: str = Form(...),
    content: str = Form(...),
    weight: int = Form(...),
    files: List[UploadFile] = File(None),
    user: User = Depends(get_user_or_admingeneral),
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(Olymp).where(Olymp.id == olymp_id))
    olymp = result.scalar_one_or_none()
    if not olymp:
        raise HTTPException(status_code=404, detail="Olympiad not found")
    
    result = await session.execute(select(Task).filter(Task.olymp_id == olymp_id).order_by(Task.task_number.desc()).limit(1))
    last_task = result.scalar_one_or_none()
    new_task_number = 1 if not last_task else last_task.task_number + 1
    
    new_task = Task(title=title, content=content, olymp_id=olymp_id, task_number=new_task_number, weight=weight)
    session.add(new_task)
    await session.commit()
    await session.refresh(new_task)
    
    attachments = await add_attachments(session, olymp_id, new_task.id, files)
    await session.commit()
    task = await session.execute(
        select(Task).options(
            selectinload(Task.attachments)
        ).where(Task.id == new_task.id)
    )
    task = task.scalar_one()
    return task

@router.patch("/{olymp_id}/tasks/{task_id}", response_model=TaskReadAttach)
async def update_task(
    olymp_id: int,
    task_id: int,
    title: str = Form(...),
    content: str = Form(...),
    weight: int = Form(...),
    files: List[UploadFile] = File(None),
    remaining_files: List[int] = Form(None),
    user: User = Depends(get_user_or_admingeneral),
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(Olymp).where(Olymp.id == olymp_id))
    olymp = result.scalar_one_or_none()
    if not olymp:
        raise HTTPException(status_code=404, detail="Olympiad not found")
    
    result = await session.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    result = await session.execute(select(TaskAttachment).where(TaskAttachment.task_id == task_id))
    attachlist = result.scalars().all()
    task.title = title
    task.content = content
    task.weight = weight
    attachments = []

    if len(attachlist) != 0:
        if remaining_files is not None:
            remaining_files_set = set(remaining_files)
            for attachment in attachlist:
                if attachment.id not in remaining_files_set:
                    await session.delete(attachment)
                    try:
                        os.remove(attachment.filepath) 
                    except FileNotFoundError:
                        pass 
                else: attachments.append(attachment)               
        else: 
            for attachment in attachlist:
                await session.delete(attachment)
                try:
                    os.remove(attachment.filepath)
                except FileNotFoundError:
                    pass 

    new_attachments = await add_attachments(session, olymp_id, task_id, files)
    attachments.extend(new_attachments)
    await session.commit()
    await session.refresh(task)
    task = await session.execute(
        select(Task).options(
            selectinload(Task.attachments)
        ).where(Task.id == task_id)
    )
    task = task.scalar_one()
    return task
@router.delete("/tasks/{task_id}", response_model=dict)
async def delete_task(task_id: int, user: User = Depends(get_user_or_admingeneral),
                      session: AsyncSession = Depends(get_async_session)):
    query = select(Task).where(Task.id == task_id)
    result = await session.execute(query)
    task = result.scalar_one_or_none()
    
    if task is None:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    await delete_task_and_attachments(session, task_id, task)
    
    result = await session.execute(
        select(Task).filter(Task.olymp_id == task.olymp_id).order_by(Task.task_number)
    )
    tasks = result.scalars().all()
    for index, t in enumerate(tasks, start=1):
        if t.task_number != index:
            t.task_number = index
            session.add(t)
    
    await session.commit()
    
    return {"status": "success"}

@router.post("/save_assignments/")
async def save_assignments(assignments: List[AssignmentRequestItem],
user: User = Depends(get_user_or_admingeneral) ,
 session: AsyncSession = Depends(get_async_session)):
    try:
        for assignment in assignments:
            await session.execute(
                delete(ExpertTaskAssignment).where(ExpertTaskAssignment.task_id == assignment.task_id)
            )
        await session.commit()
        for assignment in assignments:
            new_assignment = ExpertTaskAssignment(
                task_id=assignment.task_id,
                user_id=assignment.user_id
            )
            session.add(new_assignment)
        
        await session.commit()
        return {"status": "success"}
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_assignments/{olymp_id}")
async def get_assignments(olymp_id: int,user: User = Depends(get_user_or_admingeneral) , session: AsyncSession = Depends(get_async_session)):
    try:
        result = await session.execute(
            select(ExpertTaskAssignment).join(Task).filter(Task.olymp_id == olymp_id)
        )
        assignments = result.scalars().all()
        return [{"task_id": assignment.task_id, "user_id": assignment.user_id} for assignment in assignments]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/olymp/{olymp_id}/{attachment_id}")
async def download_attachment(
    olymp_id:int,
    attachment_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(Olymp).where(Olymp.id == olymp_id))
    olymp = result.scalar_one_or_none()
    if not olymp:
        raise HTTPException(status_code=404, detail="Олимпиада не найдена")
    users = (await session.execute(select(RegisteredOlymp).where(Olymp.id==olymp_id))).scalars().all()
    if user.id not in [reg.user_id for reg in users] and user.role_id in [5, 6]:
        raise HTTPException(status_code=403, detail="У вас нет доступа к данным файлам")
    now = datetime.utcnow()
    if now<olymp.start_date and user.role_id in [5, 6]:
        raise HTTPException(status_code=403, detail="Олимпиада еще не началась")
    result = await session.execute(select(TaskAttachment).where(TaskAttachment.id == attachment_id))
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="Файл не найден")
    filename = urllib.parse.quote(attachment.filename.encode('utf-8'))
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"; filename*=UTF-8\'\'{filename}'
    }
    return FileResponse(
        pathlib.Path(attachment.filepath),
        headers=headers
    )

@router.get("/download/answer/{attachment_id}")
async def download_answer_attachment(
    attachment_id: int,
    user: User = Depends(get_expert_or_org),
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(AnswerAttachment).where(AnswerAttachment.id == attachment_id))
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="Файл не найден")
    filename = urllib.parse.quote(attachment.filename.encode('utf-8'))
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"; filename*=UTF-8\'\'{filename}'
    }
    return FileResponse(
        pathlib.Path(attachment.filepath),
        headers=headers
    )

@router.post("/answer/{olymp_id}/{task_id}", response_model=AnswerReadAttach)
async def create_answer(
    olymp_id: int,
    task_id: int,
    content: str = Form(None),
    files: List[UploadFile] = File(None),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(Olymp).where(Olymp.id == olymp_id))
    olymp = result.scalar_one_or_none()
    if not olymp:
        raise HTTPException(status_code=404, detail="Олимпиада не найдена")
    
    now = datetime.utcnow()
    if now>olymp.end_date:
        raise HTTPException(status_code=403, detail="Олимпиада уже закончилась")
    result = await session.execute(select(Answer).where(Answer.task_id == task_id, Answer.user_id == user.id))
    answer = result.scalars().first()
    if answer:
        raise HTTPException(status_code=404, detail="Вы уже отправили ответ на данное задание")
    answer = Answer(task_id = task_id, user_id= user.id, content=content)
    session.add(answer)
    await session.commit()
    await session.refresh(answer)
    
    attachments = await add_ans_attachments(session, olymp_id, task_id, user.id, answer.id, files)
    await session.commit()
    answer = await session.execute(
        select(Answer).options(
            selectinload(Answer.attachments)
        ).where(Answer.id == answer.id)
    )
    answer = answer.scalar_one()
    return answer

@router.patch("/answer/{olymp_id}/{task_id}/{answer_id}", response_model=AnswerReadAttach)
async def update_answer(
    olymp_id: int,
    task_id: int,
    answer_id: int,
    content: str = Form(None),
    files: List[UploadFile] = File(None),
    remaining_files: List[int] = Form(None),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(Olymp).where(Olymp.id == olymp_id))
    olymp = result.scalar_one_or_none()
    if not olymp:
        raise HTTPException(status_code=404, detail="Олимпиада не найдена")
    now = datetime.utcnow()
    if now>olymp.end_date:
        raise HTTPException(status_code=403, detail="Олимпиада уже закончилась")
    result = await session.execute(select(Task).where(Task.id == task_id, Task.olymp_id == olymp_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    result = await session.execute(select(Answer).where(Answer.id == answer_id, Answer.user_id == user.id))
    answer = result.scalar_one_or_none()
    if not answer:
        raise HTTPException(status_code=404, detail="Ответ не найден или нет прав на редактирование")
    answer.content = content
    result = await session.execute(select(AnswerAttachment).where(AnswerAttachment.answer_id == answer_id))
    attachlist = result.scalars().all()
    if len(attachlist) != 0:
        if remaining_files is not None:
            remaining_files_set = set(remaining_files)
            for attachment in attachlist:
                if attachment.id not in remaining_files_set:
                    await session.delete(attachment)
                    try:
                        os.remove(attachment.filepath)
                    except FileNotFoundError:
                        pass          
        else: 
            for attachment in attachlist:
                await session.delete(attachment)
                try:
                    os.remove(attachment.filepath) 
                except FileNotFoundError:
                    pass 

    new_attachments = await add_ans_attachments(session, olymp_id, task_id, user.id, answer_id, files)
    await session.commit()
    await session.refresh(answer)

    answer = await session.execute(
        select(Answer).options(
            selectinload(Answer.attachments)
        ).where(Answer.id == answer.id)
    )
    answer = answer.scalar_one()
    return answer

@router.get("/check/experts", response_model=List[OlympRead])
async def get_experts_olymps(
     user: User = Depends(get_expert_or_org),
    session: AsyncSession = Depends(get_async_session)):
    query = (
        select(Task.olymp_id)  
        .join(ExpertTaskAssignment) 
        .where(ExpertTaskAssignment.user_id == user.id)
    )
    result = await session.execute(query)
    olymp_ids = {olymp_id for olymp_id in result.scalars()}

    if not olymp_ids:
        return []
    
    olymp_stmt = (
        select(Olymp)
        .where(Olymp.id.in_(olymp_ids), Olymp.is_active == True)
    )
    
    olymps_result = await session.execute(olymp_stmt)
    olymps = olymps_result.scalars().all()
    
    return olymps

@router.get("/expert/{olymp_id}")
async def get_olymp_for_expert( olymp_id:int, user: User = Depends(get_expert_or_org),
 session: AsyncSession = Depends(get_async_session)):
    olymp_stmt = select(Olymp).where(Olymp.id == olymp_id)
    olymp_result = await session.execute(olymp_stmt)
    olymp = olymp_result.scalar_one_or_none()

    if olymp is None:
        raise HTTPException(status_code=404, detail="Олимпиада не найдена")
    if (olymp.is_active == False):
        raise HTTPException(status_code=404, detail="К олимпиаде больше нет доступа")
    stmt = (
        select(Task)
        .join(ExpertTaskAssignment)
        .where(ExpertTaskAssignment.user_id == user.id, Task.olymp_id == olymp_id)
    )
    
    result = await session.execute(stmt)
    tasks = result.scalars().all()

    if not tasks:
        raise HTTPException(status_code=404, detail="У вас нет доступа к проверке данной олимпиады")

    return olymp
    

@router.get("/expert/{olymp_id}/tasks_to_check", response_model=List[TaskReadAttach])
async def get_tasks_to_check(olymp_id: int, user: User = Depends(get_expert_or_org),
 session: AsyncSession = Depends(get_async_session)): 
    stmt = (
        select(Task)
        .join(ExpertTaskAssignment)
        .options(selectinload(Task.attachments))
        .where(ExpertTaskAssignment.user_id == user.id, Task.olymp_id == olymp_id)
        .order_by(Task.task_number) 
    )
    
    result = await session.execute(stmt)
    tasks = result.scalars().all()

    if not tasks:
        raise HTTPException(status_code=404, detail="У вас нет доступа к проверке данной олимпиады")

    olymp_stmt = select(Olymp).where(Olymp.id == olymp_id)
    olymp_result = await session.execute(olymp_stmt)
    olymp = olymp_result.scalar_one_or_none()

    if olymp is None:
        raise HTTPException(status_code=404, detail="Олимпиада не найдена")
    return tasks

@router.get("/expert/answers/{task_id}", response_model=List[CheckedAnswersWithOwnRate])
async def get_answers_id_by_task(task_id: int, user: User = Depends(get_expert_or_org),
 session: AsyncSession = Depends(get_async_session)):
    stmt = (
        select(Answer)
        .options(selectinload(Answer.rate_answers))
        .where(Answer.task_id == task_id)
    )
    
    result = await session.execute(stmt)
    answers = result.scalars().all()

    if not answers:
        raise HTTPException(status_code=404, detail="Нет ответов для данного задания.")

    expert_rates = {rate.answer_id: rate.rate for answer in answers for rate in answer.rate_answers if rate.user_id == user.id}

    checked_answers = []
    for answer in answers:
        checked_answers.append({
            "answer_id": answer.id,
            "user_id": answer.user_id,
            "checked": answer.id in expert_rates, 
            "rate": expert_rates.get(answer.id)
        })

    return checked_answers

@router.get("/expert/answer/{answer_id}", response_model=AnswerReadAttachWithRate)
async def get_answer_for_expert_by_answer_id(
    answer_id: int,
    user: User = Depends(get_expert_or_org),
    session: AsyncSession = Depends(get_async_session)
):
    query = (
        select(Answer)
        .options(joinedload(Answer.attachments), joinedload(Answer.rate_answers)) 
        .where(Answer.id == answer_id)
    )

    result = await session.execute(query)
    answer = result.scalars().first()

    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ответ с таким id не найден"
        )

    expert_rate = next((rate.rate for rate in answer.rate_answers if rate.user_id == user.id), None)

    return AnswerReadAttachWithRate(
        answer_id=answer.id,
        task_id=answer.task_id,
        user_id=answer.user_id,
        content=answer.content,
        rate=expert_rate,
        attachments=[AnswerAttachmentRead(**attachment.__dict__) for attachment in answer.attachments]
    )
@router.post("/expert/answer/{answer_id}/rate/{rate}")
async def set_rate_for_answer(
    answer_id: int,
    rate: int,
    user: User = Depends(get_expert_or_org),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(RateAnswer).where(
        RateAnswer.answer_id == answer_id,
        RateAnswer.user_id == user.id
    )
    result = await session.execute(query)
    existing_rate = result.scalars().first()

    if existing_rate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ответ уже оценен"
        )
    new_rate = RateAnswer(
        user_id=user.id,
        answer_id=answer_id,
        rate=rate
    )
    session.add(new_rate)
    await session.commit()
    return {"message": "Оценка успешно сохранена"}
    
@router.patch("/expert/answer/{answer_id}/rate/{rate}")
async def update_rate_for_answer(
    answer_id: int,
    rate: int,
    user: User = Depends(get_expert_or_org),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(RateAnswer).where(
        RateAnswer.answer_id == answer_id,
        RateAnswer.user_id == user.id
    )
    result = await session.execute(query)
    existing_rate = result.scalars().first()

    if not existing_rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Оценка для данного ответа не найдена"
        )

    existing_rate.rate = rate
    await session.commit()
    # try:
    #     await session.commit()
    # except IntegrityError:
    #     await session.rollback()
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Ошибка обновления оценки"
    #     )

    return {"message": "Оценка успешно обновлена"}

@router.get("/expert/answer/{olymp_id}/{task_id}/localrate", response_model=List[LocalRating])
async def get_local_rate_for_expert(
    task_id: int,
    olymp_id: int,
    user: User = Depends(get_user_or_admingeneral),
    session: AsyncSession = Depends(get_async_session)
):
    registered_olymp_query = select(RegisteredOlymp).filter(RegisteredOlymp.olymp_id == olymp_id)
    registered_olymp = (await session.execute(registered_olymp_query)).scalars().all()

    task_assignments_query = select(ExpertTaskAssignment).filter(ExpertTaskAssignment.task_id == task_id)
    task_assignments = (await session.execute(task_assignments_query)).scalars().all()

    answer_query = select(Answer).filter(Answer.task_id == task_id, Answer.user_id.in_([reg.user_id for reg in registered_olymp]))
    answers = (await session.execute(answer_query)).scalars().all()
    rate_answer_query = select(RateAnswer).filter(RateAnswer.answer_id.in_([answer.id for answer in answers]))
    rate_answers = (await session.execute(rate_answer_query)).scalars().all()

    local_ratings = []


    for reg_olymp in registered_olymp:
        participant_id = reg_olymp.user_id

        answer = next((a for a in answers if a.user_id == participant_id), None)

        expert_rates = []

        # if answer:
        #     for assignment in task_assignments:
        #         if assignment.user_id != participant_id:
        #             rate = next((r for r in rate_answers if r.answer_id == answer.id and r.user_id == assignment.user_id), None)
        #             expert_rates.append(ExpertRateForParticipant(
        #                 expert_id=assignment.user_id,
        #                 rate=rate.rate if rate else None
        #             ))
        # else:
        #     expert_rates = None  
        if answer:
            for assignment in task_assignments:
                if assignment.user_id != participant_id:
                    rate = next((r for r in rate_answers if r.answer_id == answer.id and r.user_id == assignment.user_id), None)
                    expert_rates.append(ExpertRateForParticipant(
                        expert_id=assignment.user_id,
                        rate=rate.rate if rate else None
                    ))
            local_ratings.append(LocalRating(
            participant_id=participant_id,
            experts=expert_rates
        ))

        # local_ratings.append(LocalRating(
        #     participant_id=participant_id,
        #     experts=expert_rates
        # ))

    return local_ratings


@router.get("/org/totalrating/{olymp_id}", response_model=List[TotalOrgRating])
async def get_total_rate_for_org(
    olymp_id: int,
    user: User = Depends(get_adm_or_expert_or_org),
    session: AsyncSession = Depends(get_async_session)
):

    registered_olymp_query = select(RegisteredOlymp).filter(RegisteredOlymp.olymp_id == olymp_id)
    registered_olymp = (await session.execute(registered_olymp_query)).scalars().all()
  
    olymp_tasks_query = select(Task.id, Task.task_number, Task.weight).where(Task.olymp_id == olymp_id)
    tasks = (await session.execute(olymp_tasks_query)).all()

    answer_query = select(Answer.user_id, Answer.task_id).filter(Answer.user_id.in_([reg.user_id for reg in registered_olymp]))
    answers = (await session.execute(answer_query)).all()

    answer_query = (
        select(
            Answer.id,
            Answer.user_id,
            Answer.task_id,
            cast(func.coalesce(func.avg(RateAnswer.rate)), Float).label("average_rate")
        )
        .join(RateAnswer, RateAnswer.answer_id == Answer.id, isouter=True) 
        .filter(Answer.user_id.in_([reg.user_id for reg in registered_olymp]))
        .group_by(Answer.id)
    )

    answers_with_rate = (await session.execute(answer_query)).all()

    participants_query = select(User.id, User.email, User.role_id).where(
        User.id.in_([reg.user_id for reg in registered_olymp])
    )
    participants = (await session.execute(participants_query)).all()

    total_ratings = []

    for participant in participants:
        participant_id = participant.id
        participant_email = participant.email
        participant_role = participant.role_id
        rates=[]
        is_exist = False
        for task in tasks:
            answer = next((a for a in answers if a.task_id == task.id and a.user_id == participant_id), None)
            rate = next((r for r in answers_with_rate if r.task_id == task.id and r.user_id == participant_id and r.average_rate != None), None)
            if answer: 
                is_exist=True
                if rate:
                    rates.append(TasksRate(
                        task_id = task.id,
                        is_checked = True,
                        task_num = task.task_number,
                        task_weight = task.weight,
                        rate = rate.average_rate
                    ))
                else:
                    rates.append(TasksRate(
                        task_id = task.id,
                        is_checked = False,
                        task_num = task.task_number,
                        task_weight = task.weight,
                        rate = None
                    ))
            else: 
                rates.append(TasksRate(
                        task_id = task.id,
                        is_checked = True,
                        task_num = task.task_number,
                        task_weight = task.weight,
                        rate = None
                    ))
        # if  not is_exist:
        #     rates=None
        if is_exist:
            total_ratings.append(TotalOrgRating(
                participant_id = participant_id,
                is_team = participant_role == 6,
                email = participant_email,
                tasks = rates   
            )) 

    return total_ratings

@router.get("/download/participants/{olymp_id}")
async def download_olymp_participant(
    olymp_id: int,
    user: User = Depends(get_user_or_admingeneral),
    session: AsyncSession = Depends(get_async_session)
):
    olymp_query = await session.execute(select(Olymp).where(Olymp.id == olymp_id))
    olymp = olymp_query.scalar()
    if not olymp:
        raise HTTPException(status_code=404, detail="Олимпиада не найдена")

    task_query = await session.execute(select(Task.id).where(Task.olymp_id == olymp_id))
    task_ids = [task_id for task_id, in task_query.fetchall()]
    if not task_ids:
        raise HTTPException(status_code=404, detail="У олимпиады нет заданий")

    task_avg_query = (
        select(
            Answer.user_id,
            Task.id.label("task_id"),
            func.avg(RateAnswer.rate).label("average_task_rate"),
        )
        .join(RateAnswer, RateAnswer.answer_id == Answer.id)
        .join(Task, Task.id == Answer.task_id)
        .where(Task.id.in_(task_ids))
        .group_by(Answer.user_id, Task.id)
    )
    task_avg_results = await session.execute(task_avg_query)
    task_avg_data = task_avg_results.fetchall()

    user_task_averages = {}
    for row in task_avg_data:
        user_id, task_id, avg_rate = row
        if user_id not in user_task_averages:
            user_task_averages[user_id] = {}
        user_task_averages[user_id][task_id] = avg_rate

    user_total_scores = {
        user_id: sum(task_rates.values())
        for user_id, task_rates in user_task_averages.items()
    }

    participants_query = (
        select(
            RegisteredOlymp,
            User,
            TeamMembers,
        )
        .join(User, RegisteredOlymp.user_id == User.id)
        .outerjoin(TeamMembers, TeamMembers.team_id == User.id)
        .where(
            RegisteredOlymp.olymp_id == olymp_id,
            User.id.in_(user_total_scores.keys()),
        )
    )
    participants_results = await session.execute(participants_query)
    participants_data = participants_results.fetchall()

    if not participants_data:
        raise HTTPException(status_code=404, detail="Нет участников с ответами на задания олимпиады")

    sorted_participants = sorted(
        participants_data, 
        key=lambda record: user_total_scores.get(record.User.id, 0), 
        reverse=True
    )

    wb = Workbook()
    ws = wb.active
    ws.title = "Participants"

    headers = [
        "ID пользователя", "Итоговый балл", "Тип", "Фамилия участника", "Имя участника",
        "Отчество участника", "Организация", "Фамилия руководителя",
        "Имя руководителя", "Отчество руководителя", "Email"
    ]
    ws.append(headers)

    for col in ws.iter_cols(min_row=1, max_row=1, min_col=1, max_col=len(headers)):
        for cell in col:
            cell.alignment = Alignment(horizontal="center", vertical="center")

    current_user_id = None
    for record in sorted_participants:
        reg_olymp, user_record, team_member = record
        total_score = round(user_total_scores.get(user_record.id, 0), 2)

        teacher_fio = user_record.teacher.split() if user_record.teacher else ["", "", ""]
        teacher_lastname = teacher_fio[0] if len(teacher_fio) > 0 else ""
        teacher_name = teacher_fio[1] if len(teacher_fio) > 1 else ""
        teacher_surname = teacher_fio[2] if len(teacher_fio) > 2 else ""

        if user_record.role_id == 6:  # Команда
            if user_record.id != current_user_id:
                ws.append([
                    user_record.id,
                    total_score,
                    "Команда",
                    team_member.lastname,
                    team_member.name,
                    team_member.surname,
                    user_record.organisation,
                    teacher_lastname,
                    teacher_name,
                    teacher_surname,
                    user_record.email
                ])
                current_user_id = user_record.id
            else:
                ws.append([
                    "",
                    "",
                    "",
                    team_member.lastname,
                    team_member.name,
                    team_member.surname,
                    user_record.organisation,
                    teacher_lastname,
                    teacher_name,
                    teacher_surname,
                    user_record.email
                ])
        else: 
            ws.append([
                user_record.id,
                total_score,
                "Участник",
                user_record.lastname,
                user_record.name,
                user_record.surname,
                user_record.organisation,
                teacher_lastname,
                teacher_name,
                teacher_surname,
                user_record.email
            ])
    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)  
    response = StreamingResponse(
        content=stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=participants_{olymp_id}.xlsx"
    return response