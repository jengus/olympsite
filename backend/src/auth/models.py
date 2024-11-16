from datetime import datetime
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Table, Column, Integer, String, TIMESTAMP, ForeignKey, JSON, Boolean, MetaData
from sqlalchemy.orm import relationship, backref
from base import Base


class Role(Base):
    __tablename__ = "role"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    users = relationship("User", back_populates="role")


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False, unique = True)
    name = Column(String, nullable=False)
    lastname = Column(String, default=None, nullable=True)
    surname = Column(String, default=None, nullable=True)
    organisation = Column(String, default=None, nullable=True)
    teacher = Column(String, default=None, nullable=True)
    registered_at = Column(TIMESTAMP, default=datetime.utcnow)
    role_id = Column(Integer, ForeignKey("role.id"), default=1, nullable=False)
    hashed_password: str = Column(String(length=1024), nullable=False)
    is_active: bool = Column(Boolean, default=True, nullable=False)
    is_superuser: bool = Column(Boolean, default=False, nullable=False)
    is_verified: bool = Column(Boolean, default=False, nullable=False)
    
    role = relationship("Role", back_populates="users")
    registered_olymps = relationship("RegisteredOlymp", back_populates="user", cascade="all, delete")
    assignments = relationship("ExpertTaskAssignment", back_populates="user", cascade="all, delete")
    team_members = relationship("TeamMembers", back_populates="user", cascade="all, delete")
    answers = relationship("Answer", back_populates="user", cascade="all, delete")
    rate_answers = relationship("RateAnswer", back_populates="user", cascade="all,delete")

