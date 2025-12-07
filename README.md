# Futuris - The Matrix Debate 🕶️💊

Futuris is an interactive AI debate platform where three distinct AI personas—**Neo**, **Agent Smith**, and **Morpheus**—debate any topic you provide. Set in a fully immersive Matrix-themed interface, the system uses Google's latest **Gemini 2.0 Flash** models to generate real-time, streaming arguments.

## ✨ Features

*   **Three Unique AI Personas:**
    *   **Neo:** Argues for scientific optimism, evolution, and potential (The "Yes").
    *   **Agent Smith:** Argues for cynicism, inevitability, and limitations (The "No").
    *   **Morpheus:** Provides the philosophical synthesis and deeper truth.
*   **Real-Time Streaming:** Watch the debate unfold line-by-line with typewriter effects.
*   **Matrix UI:** Authentic falling code background ("Digital Rain"), glowing text, and glitch effects.
*   **The Oracle:** An impartial judge that analyzes the debate and declares a winner with a confidence score.
*   **Mobile Responsive:** Fully adaptive layout for desktop and mobile devices.
*   **Powered by Gemini 2.0:** Utilizes the cutting-edge `gemini-2.0-flash` model via the `google-genai` SDK.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Vite, CSS3 (Animations).
*   **Backend:** Python, FastAPI, Google Gen AI SDK.
*   **Deployment:** Google Cloud Run, Cloud Build, Docker, Nginx.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   Python (v3.11+)
*   Google Cloud Project (for deployment)
*   Google AI Studio API Key

### Local Development

#### 1. Backend Setup

```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\Activate
# Linux/Mac
# source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
GOOGLE_API_KEY=your_api_key_here
PORT=8080
```

Run the server:
```bash
python -m uvicorn main:app --reload --port 8080
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` (or similar).

## ☁️ Deployment

This project is configured for continuous deployment to **Google Cloud Run** using **Cloud Build**.

### Structure
*   `backend/cloudbuild.yaml`: Builds and deploys the FastAPI service.
*   `frontend/cloudbuild.yaml`: Builds the React app, pushes the Docker image, and deploys it using Nginx.

### Environment Variables (Cloud Run)
You must set the following environment variable in your Cloud Run Backend service:
*   `GOOGLE_API_KEY`: Your Gemini API key.

## 📜 License

MIT
