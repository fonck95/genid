# GenID - AI Video Generation with Vertex AI

A web application for generating AI videos using Google Cloud Vertex AI's Veo 3.1 model with facial identity consistency.

## Features

- Video generation from images using Veo 3.1
- Facial consistency preservation across video frames
- Identity management with reference photos
- Face analysis using Gemini for anthropometric descriptions
- Google OAuth2 authentication

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Vertex AI API** enabled
3. **OAuth2 Credentials** configured
4. **IAM Permissions** for the users

## Setup Instructions

### 1. Enable Vertex AI API

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Navigate to **APIs & Services > Library**
4. Search for "Vertex AI API"
5. Click **Enable**

Direct link: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com

> **Note**: After enabling the API, wait 2-3 minutes before making requests.

### 2. Configure IAM Permissions

Users need the following IAM roles to use Vertex AI:

1. Go to **IAM & Admin > IAM** in Google Cloud Console
2. Click **Add** or edit existing user
3. Add one of these roles:
   - `roles/aiplatform.user` (Vertex AI User) - Recommended
   - `roles/aiplatform.admin` (Vertex AI Admin) - Full access

### 3. Create OAuth2 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name**: GenID Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/auth/callback` (development)
     - `https://your-domain.com/auth/callback` (production)
5. Save the **Client ID** and **Client Secret**

### 4. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** (or Internal for Workspace users)
3. Fill in required fields:
   - App name
   - User support email
   - Developer contact email
4. Add scopes:
   - `https://www.googleapis.com/auth/cloud-platform`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Add test users (if in testing mode)

### 5. Environment Variables

Create a `.env` file in the project root:

```env
# Google Cloud Project ID
# Can be the project ID directly or a service account email
VITE_APP_ID_VERTEX=your-project-id

# Alternative project ID variables (fallback order)
# VITE_APP_ID=your-project-id
# VITE_VERTEX_PROJECT_ID=your-project-id

# Vertex AI Location (default: us-central1)
# See supported regions below
VITE_VERTEX_LOCATION=us-central1

# OAuth2 Credentials
VITE_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_APP_GOOGLE_CLIENT_SECRET=your-client-secret

# OAuth Callback URL (optional, defaults to {origin}/auth/callback)
# VITE_APP_GOOGLE_CALLBACK_URL=http://localhost:5173/auth/callback

# Gemini API Key (for face analysis)
VITE_APP_API_KEY_GOOGLE=your-gemini-api-key
```

### Supported Vertex AI Regions

Veo 3.1 is available in the following regions:

| Region | Endpoint |
|--------|----------|
| us-central1 | us-central1-aiplatform.googleapis.com |
| us-east1 | us-east1-aiplatform.googleapis.com |
| us-west1 | us-west1-aiplatform.googleapis.com |
| europe-west1 | europe-west1-aiplatform.googleapis.com |
| europe-west4 | europe-west4-aiplatform.googleapis.com |
| asia-northeast1 | asia-northeast1-aiplatform.googleapis.com |
| asia-southeast1 | asia-southeast1-aiplatform.googleapis.com |

Default: `us-central1`

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### 403 Permission Denied

**Possible causes:**

1. **API not enabled**
   - Visit: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
   - Enable the Vertex AI API for your project
   - Wait 2-3 minutes after enabling

2. **Missing IAM permissions**
   - Your Google account needs the "Vertex AI User" role or similar
   - Go to IAM & Admin > IAM and add the role

3. **Incorrect Project ID**
   - Verify `VITE_APP_ID_VERTEX` matches your Google Cloud project ID
   - Find your project ID at https://console.cloud.google.com

4. **User not in project**
   - The logged-in Google account must have access to the project
   - Add the user to the project IAM

### 401 Unauthenticated

**Possible causes:**

1. **Session expired**
   - Log out and log in again to refresh the OAuth token

2. **Invalid OAuth credentials**
   - Verify `VITE_APP_GOOGLE_CLIENT_ID` and `VITE_APP_GOOGLE_CLIENT_SECRET`

### 400 Bad Request - RESOURCE_PROJECT_INVALID

**Cause:** Invalid project configuration

**Solution:**
- Ensure `VITE_APP_ID_VERTEX` is a valid Google Cloud project ID
- The project must have billing enabled
- Vertex AI API must be enabled

### Service Account Email Format

If using a service account email, the project ID will be extracted automatically:

```
# This format is supported:
VITE_APP_ID_VERTEX=vertex-service@my-project-123.iam.gserviceaccount.com
# Will extract: my-project-123
```

## API Reference

### Veo 3.1 Video Generation

**Model**: `veo-3.1-generate-preview`

**Endpoint Pattern**:
```
POST https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/veo-3.1-generate-preview:predictLongRunning
```

**Request Body**:
```json
{
  "instances": [
    {
      "prompt": "Your video description",
      "image": {
        "imageBytes": "base64EncodedImage",
        "mimeType": "image/jpeg"
      }
    }
  ],
  "parameters": {
    "aspectRatio": "16:9",
    "personGeneration": "allow_adult",
    "sampleCount": 1,
    "resolution": "720p"
  }
}
```

**Authentication**: OAuth2 Bearer Token with `cloud-platform` scope

## Architecture

```
src/
├── components/
│   └── VideoGenerator.tsx    # Video generation UI
├── contexts/
│   └── AuthContext.tsx       # OAuth state management
├── services/
│   ├── veo.ts               # Vertex AI Veo API integration
│   ├── googleAuth.ts        # OAuth2 authentication
│   └── gemini.ts            # Gemini face analysis
└── types.ts                 # TypeScript interfaces
```

## License

MIT
