from pydantic import BaseModel

class SummaryFileOutput(BaseModel):
    summary_content: str|None
    error: str|None

class ExamScheduleOutput(BaseModel):
    exams: dict[str, str]|None
    error: str|None
