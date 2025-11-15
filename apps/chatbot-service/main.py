from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime
from dotenv import load_dotenv
from langchain_core.messages import AIMessageChunk
from agents.EduAgent import eduAgent
import asyncio
# Load environment variables
load_dotenv()

app = FastAPI(root_path="/api/chatbot")

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins != "*":
    allowed_origins = allowed_origins.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if isinstance(allowed_origins, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "OK", "timestamp": datetime.now().isoformat()}


# Chat endpoint with streaming
@app.post("/chat")
async def chat(request: Request):
    try:
        data = await request.json()

        user_message = data.get("userMessage")
        thread_id = data.get("threadID", "default")

        if not user_message:
            return JSONResponse(
                status_code=400, content={"error": "userMessage is required"}
            )

        def generate_stream():
            try:
                config = {"configurable": {"thread_id": thread_id}}
                for token, metadata in eduAgent.stream(
                    {"messages": [{"role":"user", "content":user_message}]},
                    config,
                    stream_mode="messages",
                ):
                    if isinstance(token, AIMessageChunk):
                        content = token.content
                        if content:
                            yield content
                            
            except Exception as e:
                yield f"Error: {str(e)}"

        # Stream response back to client
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain; charset=utf-8",
            headers={
                'Cache-Control': 'no-cache', 
                'Connection': 'keep-alive',
            }
        )

    except Exception as e:
        print(f"Chat endpoint error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "message": str(e)},
        )
