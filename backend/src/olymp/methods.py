import datetime as dt
import os
import zipfile
from http import HTTPStatus
from io import BytesIO
from pathlib import Path
from uuid import UUID
import shutil
import aiofiles
from fastapi import File, HTTPException, UploadFile
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy.orm import selectinload, joinedload

# from src.models import FileRegister
# from src.schemas.file import FileDownload
# from src.schemas.user import UserDB
import pathlib
from fastapi.responses import FileResponse, StreamingResponse
from olymp.schemas import OlympCreate, OlympRead, OlympUpdate, TaskRead, TaskCreate, TaskUpdate, TaskReadAttach, TaskAttachmentRead, AssignmentRequestItem
from olymp.models import Olymp, Task, TaskAttachment, ExpertTaskAssignment, AnswerAttachment, Answer, RegisteredOlymp


async def delete_task_and_attachments(session: AsyncSession, task_id: int, task: Task):
    await delete_answers_by_task(session, task_id, task.olymp_id)
    await session.execute(delete(ExpertTaskAssignment).where(ExpertTaskAssignment.task_id == task_id))       
    file_directory = Path(f"uploads/{task.olymp_id}/{task_id}");           
    if file_directory.exists() and file_directory.is_dir():
        shutil.rmtree(file_directory)
    await session.execute(delete(TaskAttachment).where(TaskAttachment.task_id == task_id))
    await session.execute(delete(Task).where(Task.id == task_id))
    await session.commit()
    return
async def add_attachments(session: AsyncSession, olymp_id: int, task_id:int, files: List[UploadFile]):
    attachments = []
    if files is not None:
        for file in files:
            file_directory = Path(f"uploads/{olymp_id}/{task_id}/attachments")
            file_directory.mkdir(parents=True, exist_ok=True)
            temp_file_location = file_directory / file.filename
            async with aiofiles.open(temp_file_location, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
            fileSize = len(content)
            print(f"File {file.filename} has size {fileSize}")

            attachment = TaskAttachment(
                filename=file.filename, 
                filepath=str(temp_file_location),
                file_size=fileSize,
                task_id=task_id
            )
            session.add(attachment)
            await session.commit() 
            new_id = attachment.id
            _, file_extension = os.path.splitext(file.filename)
            new_file_location = file_directory / f"{new_id}{file_extension}"
            temp_file_location.rename(new_file_location)
            attachment.filepath = str(new_file_location)
            session.add(attachment)
            attachments.append(attachment)
    return attachments

async def add_ans_attachments(session: AsyncSession, olymp_id: int, task_id:int, user_id: int, answer_id:int, files: List[UploadFile]):
    attachments = []
    if files is not None:
        for file in files:
            file_directory = Path(f"uploads/{olymp_id}/{task_id}/answers/{user_id}/")
            file_directory.mkdir(parents=True, exist_ok=True)
            
            temp_file_location = file_directory / file.filename
            async with aiofiles.open(temp_file_location, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
            fileSize = len(content)
            print(f"File {file.filename} has size {fileSize}")  
            
            attachment = AnswerAttachment(
                filename=file.filename, 
                filepath=str(temp_file_location), 
                file_size=fileSize,
                answer_id=answer_id
            )
            session.add(attachment)
            await session.commit()  
            
            new_id = attachment.id
            _, file_extension = os.path.splitext(file.filename)
            new_file_location = file_directory / f"{new_id}{file_extension}"
            temp_file_location.rename(new_file_location)

            attachment.filepath = str(new_file_location)
            session.add(attachment)
            attachments.append(attachment)
    return attachments

async def delete_answers_by_task(session: AsyncSession, task_id: int, olymp_id: int):
    file_directory = Path(f"uploads/{olymp_id}/{task_id}/answers")
    if file_directory.exists() and file_directory.is_dir():
        shutil.rmtree(file_directory)

    await session.execute(
        delete(AnswerAttachment)
        .where(AnswerAttachment.answer_id.in_(
            select(Answer.id)
            .where(Answer.task_id == task_id)
        ))
    )
    await session.execute(
        delete(Answer).where(Answer.task_id == task_id)
    )

    await session.commit()



async def delete_answers_by_user(session: AsyncSession, user_id: int):
    result = await session.execute(
        select(RegisteredOlymp.olymp_id)
        .where(RegisteredOlymp.user_id == user_id)
    )
    registered_olymp = result.scalar()
    result_tasks = await session.execute(
        select(Task)
        .options(selectinload(Task.answers))
        .where(Task.olymp_id == registered_olymp)
    )
    tasks = result_tasks.scalars().all()

    for task in tasks:
        file_directory = Path(f"uploads/{task.olymp_id}/{task.id}/answers/{user_id}")
        if file_directory.exists() and file_directory.is_dir():
            shutil.rmtree(file_directory)
    return
