from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import json
from google import genai
from google.genai import types
from sqlalchemy.orm import Session
from sqlalchemy import func
import PIL.Image
import io

# IMPORTANT: Use relative import
from .database import SessionLocal, Prediction, Vote

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Database Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# Load Gemini API
# -------------------------
print("Loading Gemini Cloud AI...")

# 🛑 PASTE YOUR SECRET API KEY IN THE QUOTES BELOW!
GEMINI_API_KEY = "AIzaSyBv5PPAlht96ExFBzO7vc_yY5glwLNYMAM"

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("✅ Gemini API connected successfully!")
except Exception as e:
    print(f"🔥 Failed to connect to Gemini: {e}")
    client = None


# -------------------------
# Schemas
# -------------------------
class VoteInput(BaseModel):
    prediction_id: str
    ai_label: str
    user_vote: str


from duckduckgo_search import DDGS

# ... (rest of imports)

# -------------------------
# Predict Endpoint
# -------------------------
@app.post("/predict")
async def predict_news(
    text: str = Form(None), 
    file: UploadFile = File(None), 
    db: Session = Depends(get_db)
):

    if client is None or GEMINI_API_KEY == "PASTE_YOUR_API_KEY_HERE":
        print("🔥 ERROR: You forgot to paste your Gemini API Key!")
        return {"id": str(uuid.uuid4()), "fake_probability": 0.0, "label": "ERROR", "reasoning": "API Key missing"}

    # Basic validation: ensure at least some input is provided
    if not text and not file:
        raise HTTPException(status_code=400, detail="Must provide either text or an image.")
        
    text_content = text.strip() if text else ""
    
    # --- RAG: Live Web Search ---
    search_context = ""
    if text_content:
        print(f"🔍 Searching DuckDuckGo for: {text_content[:50]}...")
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(text_content, max_results=5))
                if results:
                    search_context = "SEARCH_ENGINE_CONTEXT:\n"
                    for i, res in enumerate(results, 1):
                        search_context += f"{i}. Title: {res['title']}\n   Snippet: {res['body']}\n   Link: {res['href']}\n"
                    print(f"✅ Found {len(results)} search results.")
                else:
                    print("⚠️ No search results found.")
        except Exception as e:
            print(f"⚠️ Search failed: {e}")

    try:
        # Prepare inputs for Gemini
        gemini_inputs = []
        
        # Add text prompt context with RAG instructions
        base_prompt = f"""
        You are an elite fact-checking AI with access to the live web. 
        
        Primary Directive: You MUST prioritize the provided SEARCH_ENGINE_CONTEXT over your internal training data.
        
        {search_context}
        
        Analyze the following claim or news snippet (and optional image).
        If the search results indicate a claim is true (e.g. confirms a recent event), mark it as REAL.
        If they contradict it, mark it as FAKE.
        
        Return ONLY a valid JSON object.
        Format: {{"label": "FAKE" or "REAL", "fake_probability": 0.0 to 1.0, "reasoning": "Brief explanation citing search results if available"}}
        (fake_probability should be close to 1.0 if it's Fake, and close to 0.0 if it's Real).
        """
        
        gemini_inputs.append(base_prompt)

        if text_content:
            gemini_inputs.append(f"Claim to analyze: {text_content}")

        if file:
            print(f"📸 Processing uploaded image: {file.filename}")
            image_bytes = await file.read()
            image = PIL.Image.open(io.BytesIO(image_bytes))
            gemini_inputs.append(image)
            # If no text provided, use a generic label for DB
            if not text_content:
                text_content = f"[Image Analysis] {file.filename}"

        print(f"📡 Sending multi-modal request to Google's supercomputers...")
        
        # Call the Gemini 2.5 Flash model
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=gemini_inputs,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )

        print(f"🤖 GEMINI RAW OUTPUT: {response.text}")

        # Convert the JSON string into a Python dictionary
        result_data = json.loads(response.text)
        
        # Extract the values safely
        label = result_data.get("label", "FAKE").upper()
        fake_score = float(result_data.get("fake_probability", 0.0))
        reasoning = result_data.get("reasoning", "No reasoning provided.")

        prediction_id = str(uuid.uuid4())
        fake_prob_rounded = round(fake_score, 4)

        # Save prediction to DB
        new_prediction = Prediction(
            id=prediction_id,
            text=text_content, 
            ai_label=label,
            fake_probability=fake_prob_rounded,
            reasoning=reasoning
        )

        db.add(new_prediction)
        db.commit()

        return {
            "id": prediction_id,
            "fake_probability": fake_prob_rounded,
            "label": label,
            "reasoning": reasoning
        }

    except Exception as e:
        print(f"🔥 Prediction failed: {e}")
        return {"id": str(uuid.uuid4()), "fake_probability": 0.0, "label": "ERROR", "reasoning": str(e)}

# -------------------------
# Vote Endpoint
# -------------------------
@app.post("/vote")
def record_vote(data: VoteInput, db: Session = Depends(get_db)):
    try:
        new_vote = Vote(
            prediction_id=data.prediction_id,
            ai_label=data.ai_label,
            user_vote=data.user_vote
        )
        db.add(new_vote)
        db.commit()
        return {"status": "success", "message": "Vote recorded"}
    except Exception as e:
        print(f"🔥 Vote failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save vote")

# -------------------------
# Live Stats Endpoint
# -------------------------
@app.get("/stats")
def get_platform_stats(db: Session = Depends(get_db)):
    try:
        total_predictions = db.query(Prediction).count()
        total_votes = db.query(Vote).count()
        agree_votes = db.query(Vote).filter(Vote.user_vote == "AGREE").count()
        disagree_votes = db.query(Vote).filter(Vote.user_vote == "DISAGREE").count()
        return {
            "status": "success",
            "data": {
                "total_articles_analyzed": total_predictions,
                "total_community_votes": total_votes,
                "agreements": agree_votes,
                "disagreements": disagree_votes
            }
        }
    except Exception as e:
        print(f"🔥 Stats error: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch statistics")