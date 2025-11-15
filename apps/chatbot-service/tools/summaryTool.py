from dotenv import load_dotenv
load_dotenv()
import os
import traceback
from langchain.tools import tool
from agents.Model import model
from tools.type.InputScheme import SummaryFileInput
from tools.type.OutputScheme import SummaryFileOutput
from langchain_community.document_loaders import UnstructuredExcelLoader, Docx2txtLoader, UnstructuredPowerPointLoader, PyPDFLoader
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_community.document_loaders.text import TextLoader
from langchain_core.prompts import ChatPromptTemplate

MESSAGE = '''
Summarize below contents in bullet list for main details:

{content}
'''    
MESSAGE_TEMPLATE = ChatPromptTemplate([('user', MESSAGE)])

# Helper function for read file
def fileReader(path:str):
    exten = path[path.rfind('.'):]
    # print(path,exten)

    match exten:
        case '.pdf':
            loader = PyPDFLoader(path)
            doc = loader.load()
        case '.docx'|'.doc':
            loader = Docx2txtLoader(path)
            doc = loader.load()
        case '.xlxs'|'.xls':
            loader = UnstructuredExcelLoader(path)
            doc = loader.load()
        case '.pptx'|'.ppt':
            loader = UnstructuredPowerPointLoader(path)
            doc = loader.load()
        case '.csv':
            loader = CSVLoader(path)
            doc = loader.load()
        case '.txt':
            loader = TextLoader(path)
            doc = loader.load()
        case _:
            raise Exception('File type is not supported')
        
    return doc[0].page_content
    


@tool(
    'summary_file',
    args_schema=SummaryFileInput,
    description='Use this tool to summary content of file'
)
# def summaryFile( file_name: str, user_id: int, class_id: int|None = None)->SummaryFileOutput:
def summaryFile( file_name: str)->SummaryFileOutput:
    # file_path = rf'{os.environ['UPLOAD_DIR']}/{class_id if class_id else 'temp'}/{user_id}/{file_name}'
    file_path = rf'{os.environ['UPLOAD_DIR']}/temp/{file_name}'
    try:
        doc = fileReader(file_path)
        format_message = MESSAGE_TEMPLATE.format_messages(content=doc)
        summary_response = model.invoke(format_message)
        summary_content = summary_response.content
        return SummaryFileOutput(
            summary_content=summary_content,
            error=None
        ).model_dump_json()
    except Exception as e:
        traceback.print_exc()

        return SummaryFileOutput(
            summary_content=None,
            error=str(e)
        ).model_dump_json()


def test():
    res = summaryFile.invoke({'file_name':'VitOn.docx','user_id':19,'class_id':1})
    print(res)
    