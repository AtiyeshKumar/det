# 🛡️ Truth Detector AI

Truth Detector AI is a military-grade, multimodal fact-checking application. It uses **RAG (Retrieval-Augmented Generation)** to give AI the ability to search the live web, allowing it to bypass standard knowledge cutoffs and verify claims against real-time data.

## ✨ Features
* **Multimodal AI Engine:** Powered by Gemini 2.5 Pro, capable of natively processing complex inputs including text, images, video, and audio.
* **Live Web Fact-Checking:** Integrates DuckDuckGo search with Gemini to verify claims using the most up-to-date context available.
* **Secure Google Authentication:** Fully protected via NextAuth.js and Google Cloud Console OAuth 2.0 Client credentials.
* **Tactical Overlay UI:** Results are delivered via a cinematic, 16:9 glassmorphism modal with spring-physics animations.
* **Audio Micro-Interactions:** Custom Web Audio API integration plays distinct physical sound cues (`success.mp3` / `alert.mp3`) based on the REAL or FAKE verdict.

## 🛠️ Tech Stack & Google Ecosystem
This project leverages a modern, decoupled full-stack architecture heavily integrated with Google infrastructure:
* **Frontend:** Built with React and Next.js, utilizing Tailwind CSS for styling and Framer Motion for animations.
* **Backend:** Powered by Python and FastAPI for high-performance, asynchronous API routing.
* **Google Cloud Console:** Used to generate OAuth Client IDs and Secrets for secure user login via NextAuth.
* **Google AI API:** Utilizes the `google-genai` SDK to connect directly to the Gemini 2.5 Pro multimodal models.
* **Live Search:** DuckDuckGo Web Search API.

## 🚀 The Developer Journey (Version 1.0)
Building this V1 involved solving several complex full-stack challenges, including:
1. **Architecting Multimodal RAG:** Designing a pipeline where the AI first queries the live web, parses the HTML results, and uses that fresh context alongside OCR (Optical Character Recognition) from uploaded images to generate a final verdict.
2. **Managing Browser Audio Policies:** Utilizing `useRef` and `useEffect` to safely handle audio micro-interactions without violating strict browser autoplay rules.
3. **Repository Management:** Successfully restructuring a nested `.git` submodule glitch to properly host a dual-folder (Frontend/Backend) monorepo.

## 💻 Local Setup Instructions

### 1. Google Ecosystem Setup
Before running the app, you need two sets of API credentials:
* **Gemini API Key:** Go to Google AI Studio to generate your free Gemini API key.
* **OAuth Credentials:** Go to the Google Cloud Console, create a new project, navigate to APIs & Services > Credentials, and create an OAuth Client ID for a Web Application to get your Client ID and Secret.

### 2. Clone the Repository
```bash
git clone [https://github.com/AtiyeshKumar/det.git](https://github.com/AtiyeshKumar/det.git)
cd "truth detector main"
