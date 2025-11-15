from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, Form, File
import os
from datetime import datetime
from dotenv import load_dotenv
from langchain_core.messages import AIMessageChunk
from agents.EduAgent import eduAgent
from typing import Annotated, Optional
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
async def chat(
    threadID: Annotated[str, Form()],
    userMessage: Annotated[str, Form()],
    files: Optional[list[UploadFile]]=[]
    ):
    try:

        user_message = userMessage
        thread_id = threadID

        file_names = []
        if files:
            try:
                file_names = await upload_file(files)
            except Exception as e:
                return JSONResponse(
                    status_code=500, 
                    content={"error": str(e)}
                )

        if not user_message:
            return JSONResponse(
                status_code=400, 
                content={"error": "userMessage is required"}
            )

        user_message = user_message+f'\n\nList of file name:\n{'\n'.join(file_names)}'

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

async def upload_file(files: list[UploadFile]) -> list[str]:
    UPLOAD_DIR = os.path.join(os.getenv('UPLOAD_DIR'),'temp')
    file_names = []
    for file in files:
        try:
            file_path = os.path.join(UPLOAD_DIR, file.filename)

            file_names.append(file.filename)
            
            with open(file_path, "wb") as f:
                while (chunk := await file.read(1024 * 1024)):  # 1MB chunk
                    f.write(chunk)

            print('Upload file successfully', file.filename)
        except Exception as e:
            raise Exception('Failed to upload file:', file.filename)

    return file_names