from pydantic import BaseModel
from tools.type.UtilScheme import ClassInfo, MaterialInfo

class SummaryFileOutput(BaseModel):
    summary_content: str|None
    error: str|None

class ExamScheduleOutput(BaseModel):
    exams: list[dict[str,str|int]]|None
    error: str|None

class GetAllClassInfoOfOutput(BaseModel):
    class_info_list: list[ClassInfo]|None
    error:str|None

class GetAllMaterialInfoOfClassOutput(BaseModel):
    material_info_list: list[MaterialInfo]|None
    error:str|None