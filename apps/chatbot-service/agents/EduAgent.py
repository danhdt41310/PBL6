from dotenv import load_dotenv
load_dotenv()
from langgraph.checkpoint.memory import MemorySaver
from langchain.agents import create_agent
from langgraph.graph import START, END, MessagesState, StateGraph
from langchain_core.messages import HumanMessage, SystemMessage
from tools.summaryTool import summaryFile
from tools.examScheduleTool import examSchedule
from agents.Model import model
memory = MemorySaver()
my_tools = [
    summaryFile,
    examSchedule,
]
systemPrompt = """
You are StudentAssist — an AI assistant for students.

Your goals:
1. Summarize academic documents into clear, structured study notes.
2. Retrieve online exam schedules and show them in a readable table.
3. Answer students questions about general knowledge.

Important:
- Be concise, factual, and helpful.
- Ask clarifying questions if input is unclear.
- Cite sources when retrieving online information.
"""


eduAgent = create_agent(
    model=model,
    tools=my_tools,
    checkpointer=memory,
    system_prompt=systemPrompt,
)
