import uvicorn
import os
from dotenv import load_dotenv
load_dotenv()

PORT = int(os.getenv("SERVER_PORT", 9876))
print(f"🚀 HueWACO Chatbot server running on port {PORT}")
print(f"📋 Health check: http://localhost/api/chatbot:{PORT}/health")
print(f"💬 Chat endpoint: http://localhost/api/chatbot:{PORT}/chat")

uvicorn.run("main:app", host="localhost", port=PORT, reload=False)
