import dotenv
dotenv.load_dotenv()

from tools.type.InputScheme import ExamScheduleInput
from tools.type.OutputScheme import ExamScheduleOutput
from langchain.tools import tool
import requests, os
import json

BASE_API = os.environ['BASE_API']

def getAllClassIdOf(user_id:int, role:str):
    res = requests.get(f'{BASE_API}/classes/of/{role}/{user_id}')
    data_json = res.json()
    if res.status_code == 200:
        class_list = map(lambda cls: cls.get('class_id',None), data_json)
        return class_list
    
    raise Exception(data_json.get('message', 'error from request for get class ids'))

def getExamSchudleFromClassIds(class_ids:list[int]):
    res= requests.get(
        f'{BASE_API}/exam/of',
        data=json.dumps(class_ids)
    )
    data_json = res.json()

    if data_json['success']:
        exams = data_json['data']
        return exams
    
    raise Exception(data_json.get('message', 'error from request for get all exams of class ids'))


@tool(
    'get_exam_schedule', 
    args_schema=ExamScheduleInput, 
    description='Use this tool to get exam schedule (date, start time, end time) as well as exam information'
)
def examSchedule(user_id: int, role: str):
    try:
        class_ids = getAllClassIdOf(user_id, role)
        exams=[]
        if len(class_ids):
            exams = getExamSchudleFromClassIds(class_ids)

        return ExamScheduleOutput(
            exams=exams,
            error=None
        )
    except Exception as e:
        return ExamScheduleInput(
            exams=None,
            error=str(e)
        )
