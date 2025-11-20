from pydantic import BaseModel, Field
from enum import Enum
# ---------------------------------------------------------

class UserRole(Enum):
    STUDENT='student'
    TEACHER='teacher'

class SummaryFileInput(BaseModel):
    file_name: str = Field(...,description='name of file (include file extension) need to be summarized')
    # user_id:int = Field(..., description='id of user uploading file')
    # class_id:int|None = Field(None, description='id of class containing file')

class ExamScheduleInput(BaseModel):
    user_id: int = Field(..., description='id of user that want to get exams schedule')
    user_role: UserRole = Field(...,description='role of user that  want to get exams schedule')