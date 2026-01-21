import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const KLING_API_BASE = 'https://api-singapore.klingai.com';

// Use server-side env vars (without VITE_ prefix)
const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY || process.env.VITE_APP_API_KLING_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY || process.env.VITE_APP_SECRET_KLING;

// Default system prompt for photorealistic video generation with facial consistency
const DEFAULT_VIDEO_SYSTEM_PROMPT = `CINEMATIC VIDEO GENERATION - PHOTOREALISTIC HUMAN MOTION.

IDENTITY PRESERVATION (CRITICAL): Maintain absolute facial consistency with the anthropometric profile. Every frame must preserve:
- Exact facial bone structure: skull shape, jaw angle, cheekbone prominence
- Orbital region: eye shape, eyelid configuration, eyebrow morphology
- Nasal anatomy: dorsum profile, alar width, tip shape
- Labial features: lip thickness, Cupid's bow definition
- Skin characteristics: texture, tone, marks, micro-details
- Hair patterns: color, texture, natural movement

PHOTOREALISTIC MOTION REQUIREMENTS:
- Natural physics: weight distribution, momentum, gravity on hair/clothing
- Micro-expressions: subtle facial muscles, eye tracking, natural blinks (3-5s intervals)
- Breathing rhythm: visible chest/shoulder movement
- Skin dynamics: subsurface scattering, pore visibility
- Natural imperfections: minor asymmetries, realistic texture

CINEMATOGRAPHY STANDARDS:
- Consistent lighting (no AI flickering)
- Natural motion blur on fast movements
- Depth of field coherence
- Color grading continuity
- Realistic shadow behavior

CRITICAL AVOIDANCES:
- Plastic/synthetic skin appearance
- Morphing artifacts between frames
- Unnatural or dead eyes
- Robotic motion quality
- Temporal facial inconsistency
- Over-smoothed skin texture
- Physics-defying hair/clothing

OUTPUT: Indistinguishable from professional 4K cinema footage.

[FACE_ANTHROPOMETRY]
{FACE_DESCRIPTION}
[/FACE_ANTHROPOMETRY]

[MOTION]
{USER_PROMPT}
[/MOTION]`;

const KLING_VIDEO_SYSTEM_PROMPT = process.env.VITE_APP_KLING_VIDEO_SYSTEM_PROMPT || DEFAULT_VIDEO_SYSTEM_PROMPT;

/**
 * Builds the final video prompt combining system prompt, face description, and user motion request
 */
function buildVideoPrompt(userPrompt: string, faceDescription?: string): string {
  // If no face description, return just the user prompt with basic enhancement
  if (!faceDescription) {
    return `Photorealistic cinematic video. Natural human motion with realistic physics. Consistent lighting, no AI artifacts. ${userPrompt}`;
  }

  // Build the complete prompt with anthropometric data
  const finalPrompt = KLING_VIDEO_SYSTEM_PROMPT
    .replace('{FACE_DESCRIPTION}', faceDescription)
    .replace('{USER_PROMPT}', userPrompt);

  return finalPrompt;
}

/**
 * Generates a JWT token for Kling API authentication
 */
function generateJwtToken(): string {
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    throw new Error('Kling API credentials not configured');
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: now + 1800,
    nbf: now - 5
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', KLING_SECRET_KEY)
    .update(signatureInput)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = generateJwtToken();
    const { faceDescription, prompt, ...restBody } = req.body;

    // Build enhanced prompt with facial anthropometry if available
    const enhancedPrompt = buildVideoPrompt(prompt, faceDescription);

    const requestBody = {
      ...restBody,
      prompt: enhancedPrompt
    };

    const response = await fetch(`${KLING_API_BASE}/v1/videos/image2video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Kling API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
