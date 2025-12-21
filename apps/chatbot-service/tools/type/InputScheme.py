from pydantic import BaseModel, Field
from enum import Enum
# ---------------------------------------------------------

class UserRole(str, Enum):
    STUDENT="student"
    TEACHER="teacher"

class SummaryFileInput(BaseModel):
    file_name: str = Field(...,description='name of file (include file extension) need to be summarized')
    # user_id:int = Field(..., description='id of user uploading file')
    # class_id:int|None = Field(None, description='id of class containing file')

class UserInfoInput(BaseModel):
    user_id: int = Field(..., description='id of user')
    user_role: UserRole = Field(...,description='role of user (Valid values are: "student" or "teacher")')

class GetAllMaterialInfoOfClassInput(BaseModel):
    class_id: int=Field(...,description='class id of class you want to get all materials information from')