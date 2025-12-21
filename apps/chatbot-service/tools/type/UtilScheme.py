from pydantic import BaseModel,Field


class ClassInfo(BaseModel):
    class_id:int|None
    class_name:str|None
    class_code:str|None
    description:str|None

class MaterialInfo(BaseModel):
    material_id:int|None
    title:str|None
    type:str|None = Field('other', 'file type, valid data are document "image", "video", "audio", "other"')
    file_size:int|None