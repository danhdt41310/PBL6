from dotenv import load_dotenv
load_dotenv()
from langgraph.checkpoint.memory import MemorySaver
from langchain.agents import create_agent
from langgraph.graph import START, END, MessagesState, StateGraph
from langchain_core.messages import HumanMessage, SystemMessage
from tools.summaryTool import summaryFile
from tools.UserRelatedTools import examSchedule, getAllClassInfoOf, getAllMaterialInfoOfClass
from agents.Model import model
memory = MemorySaver()
my_tools = [
    summaryFile,
    examSchedule,
    getAllClassInfoOf,
    getAllMaterialInfoOfClass
]
systemPrompt = """
You are EduAssist — an AI assistant for students.

Your goals:
1. Summarize academic documents into clear, structured study notes.
2. Answer students questions about general knowledge.
3. Retrieve online exam schedules and show them in a readable table.
4. List all information of classes that user have joined
5. List all information of materials in a specific class  

Important:
- Be concise, factual, and helpful.
- Ask clarifying questions if input is unclear.
- Cite sources when retrieving online information.
- Always using Vietnamese for answer except for cases that you are required to use another language
"""


eduAgent = create_agent(
    model=model,
    tools=my_tools,
    checkpointer=memory,
    system_prompt=systemPrompt,
)
