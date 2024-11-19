import uuid
from typing import Optional
from pydantic import BaseModel
from fastapi_users import schemas
from datetime import datetime, timezone
from typing import List
class OlympBase(BaseModel):
     name: str
     description: str
     is_active: bool
     start_date: datetime
     end_date: datetime

class OlympCreate(OlympBase):
    is_active: bool = False
    def to_utc(self):
        self.start_date = self.start_date.astimezone(timezone.utc).replace(tzinfo=None)
        self.end_date = self.end_date.astimezone(timezone.utc).replace(tzinfo=None)

class OlympRead(OlympBase):
    id: int

    class Config:
         orm_mode=True
class OlympReadWithCount(OlympRead):
    count: int
class OlympUpdate(OlympBase):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    def to_utc(self):
        if self.start_date is not None:
            self.start_date = self.start_date.astimezone(timezone.utc).replace(tzinfo=None)
        if self.end_date is not None:
            self.end_date = self.end_date.astimezone(timezone.utc).replace(tzinfo=None)

class TaskBase(BaseModel):
    title: str
    content: str
    weight: int
class TaskAttachmentRead(BaseModel):
    id: int
    filename: str
    filepath: str
    file_size: int

    class Config:
        orm_mode = True

class TaskCreate(TaskBase):
    pass
class TaskUpdate(TaskBase):
    pass
class TaskReadAttach(TaskBase):
    id: int
    olymp_id: int
    task_number: int
    attachments: List[TaskAttachmentRead]
    class Config:
        orm_mode = True
class TaskRead(TaskBase):
    id: int
    olymp_id: int
    task_number: int
    class Config:
        orm_mode = True
class ExpertAssignment(BaseModel):
    user_id: int
    task_id: int
class AssignmentRequestItem(BaseModel):
    task_id: int
    user_id: int

class TeamMembers(BaseModel):
    name: str
    lastname: str
    surname: str
class TeamMembersCreate(TeamMembers):
    pass
class TeamMembersUpdate(TeamMembers):
    id:int

class TeamMembersRead(TeamMembers):
    id:int
    class Config:
        orm_mode = True
        from_attributes=True
class AnswerBase(BaseModel):
    content: Optional[str] = None

class AnswerAttachmentRead(BaseModel):
    id: int
    filename: str
    filepath: str
    file_size: int

    class Config:
        orm_mode = True

class AnswerReadAttach(AnswerBase):
    id: int
    task_id: int
    user_id: int
    attachments: List[AnswerAttachmentRead]
    class Config:
        orm_mode = True

class TaskReadWithAnswer(BaseModel):
    id: int
    olymp_id: int
    task_number: int
    title: str
    content: str
    weight: int
    attachments: List[TaskAttachmentRead]
    user_answer: Optional[AnswerReadAttach]
    class Config:
        orm_mode = True

class CheckedAnswersWithOwnRate(BaseModel):
    user_id: int
    answer_id: int
    checked: bool
    rate: Optional[int] = 0
    class Config:
        orm_mode = True

class AnswerReadAttachWithRate(AnswerBase):
    answer_id: int
    task_id: int
    user_id: int
    rate: Optional[int] = 0
    attachments: List[AnswerAttachmentRead]
    class Config:
        orm_mode = True

class ExpertRateForParticipant(BaseModel):
    expert_id: int
    rate: Optional[int] = None
class LocalRating(BaseModel):
    participant_id: int
    experts: Optional[List[ExpertRateForParticipant]] = None

class TasksRate(BaseModel):
    task_id: int
    task_num:int
    task_weight: int
    is_checked: bool
    rate: Optional[float] = None
class TotalOrgRating(BaseModel):
    participant_id: int
    is_team: bool
    email: str
    tasks: Optional[List[TasksRate]] = None