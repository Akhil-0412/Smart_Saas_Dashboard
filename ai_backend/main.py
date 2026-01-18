from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import after loading env to ensure keys are present
from agent import run_agent

app = FastAPI(title="AI Vehicle Maintenance Advisor")

class AnalyzeRequest(BaseModel):
    query: str
    make: str
    model: str
    year: int
    mileage: int
    history: list[dict] = [] # List of {"role": "user"|"bot", "content": "..."}

@app.get("/health")
def health():
    return {"status": "ok", "service": "AI Maintenance Advisor"}

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        # Context includes vehicle details
        vehicle_context = f"Vehicle: {request.year} {request.make} {request.model} with {request.mileage} miles."
        
        result = await run_agent(request.query, request.history, vehicle_context)
        # Result is already a dict {"advice": ..., "suggestions": ...}
        return {
            "response": result.get("advice", "No advice generated."),
            "suggestions": result.get("suggestions", []),
            "video_link": result.get("video_link"),
            "video_label": result.get("video_label")
        }
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
