from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import json
import os
import tempfile
import shutil
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types
from sqlalchemy.orm import Session
from sqlalchemy import func
import PIL.Image
import io
from ddgs import DDGS

# ── Deepfake forensics (optional — disabled if torch not installed) ──────────
try:
    from .forensics import analyze_pixels, load_detector
    DEEPFAKE_AVAILABLE = True
except ImportError:
    DEEPFAKE_AVAILABLE = False
    print("[INFO] Deepfake module not available (torch not installed). Deepfake endpoint disabled.")

# Loaded once at server startup so every request is fast
_deepfake_detector = None

# IMPORTANT: Use relative import
from .database import SessionLocal, Prediction, Vote

app = FastAPI()

# CORS — allow both local dev and production Vercel frontend
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    "http://localhost:3000",
    "https://det-gamma.vercel.app",
    FRONTEND_URL,
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_load_models():
    """Skip loading deepfake model at startup — loaded lazily on first request."""
    print("[STARTUP] Deepfake model will load lazily on first request.")

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

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

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



# -------------------------
# RAG: Live Web Search
# -------------------------
def fetch_live_news(claim: str) -> str:
    """
    Searches DuckDuckGo for the given claim and returns a clean string
    containing the snippets of the top 3 results.
    """
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(claim, max_results=3))
        if not results:
            return "No live web results found."
        snippets = []
        for i, res in enumerate(results, 1):
            snippets.append(f"{i}. {res.get('title', '')}\n   {res.get('body', '')}")
        context_text = "\n\n".join(snippets)
        print(f"\n📰 LIVE NEWS CONTEXT FETCHED:\n{context_text}\n")
        return context_text
    except Exception as e:
        print(f"⚠️ fetch_live_news failed: {e}")
        return f"Web search unavailable: {e}"

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
    live_news_context = ""
    if text_content:
        print(f"🔍 Searching DuckDuckGo for: {text_content[:50]}...")
        live_news_context = fetch_live_news(text_content)
        print(f"✅ Live news context fetched.")

    try:
        # Prepare inputs for Gemini
        gemini_inputs = []
        
        # Add text prompt context with RAG instructions
        base_prompt = f"""You are a Truth Detector AI. You must use the following live web search context to verify the user's claim. If the live news proves the claim is true, you must override your internal knowledge cutoff date and output a TRUE verdict. \n\nLIVE WEB CONTEXT:\n{live_news_context}\n\nUSER CLAIM: {text_content}

        You MUST return ONLY a valid JSON object with exactly these three fields:
        {{
          "label": "FAKE" or "REAL",
          "confidence_score": <INTEGER between 0 and 100 — your confidence in the verdict, always above 50>,
          "reasoning": "Brief explanation citing search results if available"
        }}

        CRITICAL RULES:
        - "confidence_score" MUST be a plain JSON integer (e.g. 87), NOT a float, NOT a string.
        - It represents how confident you are in the verdict (FAKE or REAL), so it should be between 50 and 99.
        - Do NOT include any other fields. Do NOT wrap the JSON in markdown.
        """
        
        gemini_inputs.append(base_prompt)

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
            model='gemini-2.0-flash',
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
        confidence_score = int(result_data.get("confidence_score", 75))
        reasoning = result_data.get("reasoning", "No reasoning provided.")

        prediction_id = str(uuid.uuid4())

        # Save prediction to DB
        new_prediction = Prediction(
            id=prediction_id,
            text=text_content,
            ai_label=label,
            fake_probability=confidence_score / 100.0,
            reasoning=reasoning
        )

        db.add(new_prediction)
        db.commit()

        return {
            "id": prediction_id,
            "confidence_score": confidence_score,
            "label": label,
            "reasoning": reasoning
        }

    except Exception as e:
        print(f"🔥 Prediction failed: {e}")
        return {"id": str(uuid.uuid4()), "confidence_score": 0, "label": "ERROR", "reasoning": str(e)}

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


# ─────────────────────────────────────────────────────────────────────────────
# Deepfake Image Analysis Endpoint
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    """
    Accepts a JPEG/PNG upload, runs it through the local ViT deepfake detector,
    and returns Deepfake + Realism confidence scores as percentages.
    """
    # ── 1. Validate content type ──────────────────────────────────────────────
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Please upload JPEG or PNG.",
        )

    # ── 2. Save upload to a temp file ─────────────────────────────────────────
    suffix = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    tmp_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        print(f"[analyze-image] Saved temp file → {tmp_path}")

        # ── 3. Run inference ──────────────────────────────────────────────────
        raw_scores: dict = analyze_pixels(tmp_path, detector=_deepfake_detector)

        print(f"[analyze-image] Raw scores: {raw_scores}")

    except Exception as exc:
        print(f"[analyze-image] 🔥 Inference error: {exc}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}")

    finally:
        # ── 4. Delete temp file no matter what ───────────────────────────────
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
            print(f"[analyze-image] Temp file deleted ✅")

    # ── 5. Normalise labels and build response ────────────────────────────────
    # The model may return 'Deepfake' / 'Realism' or similar casing — normalise.
    def _find_score(raw: dict, keyword: str) -> float:
        """Case-insensitive lookup and return as a rounded percentage."""
        for key, val in raw.items():
            if keyword.lower() in key.lower():
                return round(float(val) * 100, 2)
        return 0.0

    deepfake_pct = _find_score(raw_scores, "fake")
    realism_pct  = _find_score(raw_scores, "real")

    verdict = "DEEPFAKE" if deepfake_pct > realism_pct else "REAL"

    return {
        "verdict": verdict,
        "scores": {
            "Deepfake": deepfake_pct,
            "Realism":  realism_pct,
        },
        "filename": file.filename,
    }