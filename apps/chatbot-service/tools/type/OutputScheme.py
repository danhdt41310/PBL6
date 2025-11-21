from pydantic import BaseModel

class SummaryFileOutput(BaseModel):
    summary_content: str|None
    error: str|None

class ExamScheduleOutput(BaseModel):
    exams: list[dict[str,str|int]]|None
    error: str|None
