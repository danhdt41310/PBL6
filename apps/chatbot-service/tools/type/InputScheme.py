from pydantic import BaseModel, Field
# ---------------------------------------------------------

class SummaryFileInput(BaseModel):
    file_name: str = Field(...,description='name of file (include file extension) need to be summarized')
    # user_id:int = Field(..., description='id of user uploading file')
    # class_id:int|None = Field(None, description='id of class containing file')