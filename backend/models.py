from sqlalchemy import Column, String, Integer, Boolean, JSON, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    skills = Column(JSON, default=[])
    niche = Column(String)
    experience_level = Column(String)        # junior / mid / senior
    preferred_rate_min = Column(Integer)
    preferred_rate_max = Column(Integer)
    preferred_job_type = Column(String)      # fixed / hourly / both
    preferred_job_size = Column(String)      # small / medium / large
    writing_samples = Column(Text)           # raw samples — used once
    tone_summary = Column(Text)              # AI extracted — used every proposal
    portfolio = Column(JSON, default=[])
    keywords_include = Column(JSON, default=[])
    keywords_exclude = Column(JSON, default=[])
    runs_used = Column(Integer, default=0)
    runs_limit = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

class SeenJob(Base):
    __tablename__ = "seen_jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_id = Column(String, nullable=False)
    seen_at = Column(DateTime, default=datetime.utcnow)