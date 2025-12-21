import dotenv
dotenv.load_dotenv()

from tools.type.InputScheme import UserInfoInput, UserRole, GetAllMaterialInfoOfClassInput
from tools.type.UtilScheme import ClassInfo, MaterialInfo
from tools.type.OutputScheme import ExamScheduleOutput, GetAllClassInfoOfOutput, GetAllMaterialInfoOfClassOutput
from langchain.tools import tool
import requests, os
import json

BASE_API = os.environ['BASE_API']

def _getAllClassInfoOf(user_id:int, user_role:UserRole)->list[ClassInfo]:
    res = requests.get(f'{BASE_API}/classes/of/{user_role}/{user_id}')
    data_json = res.json()
    if res.status_code == 200 and data_json['success']:
        class_list = list(map(
            lambda cls: ClassInfo(
                class_id=cls.get('class_id', None),
                class_code=cls.get('class_code', None),
                class_name=cls.get('class_name', None),
                description=cls.get('description', None),
            ), 
            data_json.get('data', [])
        ))
        return class_list
    
    raise Exception(data_json.get('message', 'error from request for get class ids'))

@tool(
    'get_all_class_information_of_user',
    args_schema=UserInfoInput,
    description='Use this tool to get information of all class of a specific user',
)
def getAllClassInfoOf(user_id:int, user_role:UserRole):
    try:
        class_list = _getAllClassInfoOf(user_id, user_role)
        return GetAllClassInfoOfOutput(
                class_info_list=class_list,
                error=None
            ).model_dump_json()
    
    except Exception as e:
        return GetAllClassInfoOfOutput(
            class_info_list=None,
            error=str(e)
        ).model_dump_json()


def getExamSchudleFromClassIds(class_ids:list[int]):
    res= requests.post(
        f'{BASE_API}/exams/of',
        data={"class_ids":class_ids}
    )
    data_json = res.json()
    if res.status_code == 201 and data_json.get('success',False) and data_json.get('data',{}).get('success',False):
        exams = data_json.get('data',{}).get('value',[])
        return exams
    
    raise Exception(data_json.get('message', 'error from request for get all exams of class ids'))


@tool(
    'get_exam_schedule', 
    args_schema=UserInfoInput, 
    description='Use this tool to get exam schedule (date, start time, end time) as well as exam information'
)
def examSchedule(user_id: int, user_role: UserRole)->str:
    try:
        class_ids =[cls.class_id for cls in _getAllClassInfoOf(user_id, user_role.value).class_info_list]
        # print(class_ids, type(class_ids))
        exams=[]
        if len(class_ids):
            exams = getExamSchudleFromClassIds(class_ids)
            # print(exams)
        return ExamScheduleOutput(
            exams=exams,
            error=None
        ).model_dump_json()
    except Exception as e:
        return ExamScheduleOutput(
            exams=None,
            error=str(e)
        ).model_dump_json()


def getAllMaterialInfoFromClassId(class_id:int)->list[MaterialInfo]:
    res = requests.get(
        f'{BASE_API}/classes/{class_id}/get-all-materials'
    )
    data_json = res.json()
    if res.status_code == 201 and data_json.get('success',False):
        materials = [
            MaterialInfo(
                material_id=materials.get('material_id', None),
                title=materials.get('title', None),
                type=materials.get('type',None),
                file_size=materials.get('file_size', None)
            ) for materials in data_json.get('data',[])
        ]
        return materials

    raise Exception(data_json.get('message', 'error from request for get all material inforamtion of class ids'))

@tool(
    'get_all_material_info_of_class',
    args_schema=GetAllMaterialInfoOfClassInput,
    description="Use this tool to get all materials' information of a specific class"
)
def getAllMaterialInfoOfClass(class_id:int)->str:
    try:
        materials_info = getAllMaterialInfoFromClassId(class_id)
        return GetAllMaterialInfoOfClassOutput(
            material_info_list=materials_info,
            error=None
        ).model_dump_json()
    except Exception as e:
        return GetAllMaterialInfoOfClassOutput(
            material_info_list=None,
            error=str(e)
        ).model_dump_json()

def test():
    result = examSchedule.invoke({"user_id":10, "user_role":"student"})
    print(result)