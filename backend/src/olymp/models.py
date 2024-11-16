from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from base import Base

class Olymp(Base):
    __tablename__ = "olymp"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    start_date = Column(TIMESTAMP, nullable=False)
    end_date = Column(TIMESTAMP, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    tasks = relationship("Task", back_populates="olymp", cascade="all, delete")
    registered_olymps = relationship("RegisteredOlymp", back_populates="olymp", cascade="all, delete")
class Task(Base):
    __tablename__ = "task"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    olymp_id = Column(Integer, ForeignKey("olymp.id"))
    task_number = Column(Integer, index=True)
    weight = Column(Integer, nullable=False)
    
    olymp = relationship("Olymp", back_populates="tasks")
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete")
    assignments = relationship("ExpertTaskAssignment", back_populates="task", cascade="all, delete")
    answers = relationship("Answer", back_populates="task", cascade="all, delete")

class TaskAttachment(Base):
    __tablename__ = "task_attachment"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    task_id = Column(Integer, ForeignKey("task.id"))
    task = relationship("Task", back_populates="attachments")

class ExpertTaskAssignment(Base):
    __tablename__ = "expert_task_assignments"

    task_id = Column(Integer, ForeignKey("task.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("user.id"), primary_key=True)
    
    task = relationship("Task", back_populates="assignments")
    user = relationship("User", back_populates="assignments")

class RegisteredOlymp(Base):
    __tablename__ = "registered_olymp"

    user_id = Column(Integer, ForeignKey("user.id"), primary_key=True)
    olymp_id = Column(Integer, ForeignKey("olymp.id"), primary_key=True)
    user = relationship("User", back_populates="registered_olymps", cascade="all, delete")
    olymp = relationship("Olymp", back_populates="registered_olymps")

class TeamMembers(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    lastname = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    user = relationship("User", back_populates="team_members")

class Answer(Base):
    __tablename__ = "answer"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("task.id"))
    user_id = Column(Integer, ForeignKey("user.id"))
    content = Column(Text, nullable=True)

    task = relationship("Task", back_populates="answers")
    user = relationship("User", back_populates="answers")
    attachments = relationship("AnswerAttachment", back_populates="answer", cascade="all, delete")
    rate_answers = relationship("RateAnswer", back_populates="answer", cascade="all, delete")

class AnswerAttachment(Base):
    __tablename__ = "answer_attachment"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    answer_id = Column(Integer, ForeignKey("answer.id"))

    answer = relationship("Answer", back_populates="attachments")

class RateAnswer(Base):
    __tablename__ = "rate_answer"
    user_id = Column(Integer, ForeignKey("user.id"), primary_key=True)
    answer_id = Column(Integer, ForeignKey("answer.id"), primary_key=True)
    rate = Column(Integer, nullable=False)

    user = relationship("User", back_populates="rate_answers")
    answer = relationship("Answer", back_populates="rate_answers")