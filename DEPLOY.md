# Deployment Guide for Google Cloud Run

This guide assumes you have the Google Cloud SDK (`gcloud`) installed and authenticated.

## 1. Setup Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID (replace YOUR_PROJECT_ID)
gcloud config set project YOUR_PROJECT_ID

# Enable necessary APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

## 2. Deploy Backend

We will deploy the backend first to get the API URL.

```bash
# Navigate to backend
cd backend

# Submit build to Cloud Build (creates a container image)
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/futuris-backend

# Deploy to Cloud Run
gcloud run deploy futuris-backend \
  --image gcr.io/YOUR_PROJECT_ID/futuris-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=your_google_api_key_here
```

**IMPORTANT:** Note the URL provided in the output (e.g., `https://futuris-backend-xyz.a.run.app`). You will need this for the frontend.

## 3. Deploy Frontend

Now we deploy the frontend, pointing it to the backend we just created.

```bash
# Navigate to frontend
cd ../frontend

# Build the frontend container using Cloud Build
# Replace BACKEND_URL with the URL you got from the previous step (e.g., https://futuris-backend-xyz.a.run.app)
gcloud builds submit --config cloudbuild.yaml --substitutions=_API_URL=BACKEND_URL

# Deploy to Cloud Run
gcloud run deploy futuris-frontend \
  --image gcr.io/YOUR_PROJECT_ID/futuris-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 4. Access the App

Click the URL provided by the frontend deployment to access your Matrix Debate application!

---

### Troubleshooting

*   **CORS Issues:** If the frontend can't talk to the backend, ensure the backend allows the frontend's domain. You might need to update `backend/main.py` to add the frontend Cloud Run URL to the `CORSMiddleware` origins list.
*   **Environment Variables:** Ensure `GOOGLE_API_KEY` is set correctly in the backend deployment.
