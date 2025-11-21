import dotenv
dotenv.load_dotenv()

from tools.type.InputScheme import ExamScheduleInput, UserRole
from tools.type.OutputScheme import ExamScheduleOutput
from langchain.tools import tool
import requests, os
import json

BASE_API = os.environ['BASE_API']

def getAllClassIdOf(user_id:int, role:str):
    res = requests.get(f'{BASE_API}/classes/of/{role}/{user_id}')
    data_json = res.json()
    if res.status_code == 200 and data_json['success']:
        class_list = list(map(lambda cls: cls.get('class_id',None), data_json.get('data', [])))
        return class_list
    
    raise Exception(data_json.get('message', 'error from request for get class ids'))

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
    args_schema=ExamScheduleInput, 
    description='Use this tool to get exam schedule (date, start time, end time) as well as exam information'
)
def examSchedule(user_id: int, user_role: UserRole):
    try:
        class_ids = getAllClassIdOf(user_id, user_role.value)
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
        return ExamScheduleInput(
            exams=None,
            error=str(e)
        ).model_dump_json()

def test():
    result = examSchedule.invoke({"user_id":10, "user_role":"student"})
    print(result)