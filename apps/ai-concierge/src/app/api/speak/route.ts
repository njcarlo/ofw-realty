import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

function cleanText(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/[#*_`~]/g, '')
    .replace(/₱/g, 'piso ')
    .replace(/→/g, '')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim()
}

// ── ElevenLabs TTS (best quality) ────────────────────────────────────────────
async function elevenLabsTTS(text: string): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return null

  // "Adam" — deep, warm, professional male voice
  // Other good options: "Antoni" (warm), "Josh" (deep), "Arnold" (authoritative)
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB' // Adam

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2', // supports Filipino/Taglish
      voice_settings: {
        stability: 0.55,        // balanced — not too robotic, not too variable
        similarity_boost: 0.80, // stays close to the voice character
        style: 0.20,            // slight expressiveness
        use_speaker_boost: true,
      },
    }),
  })

  if (!res.ok) return null
  return Buffer.from(await res.arrayBuffer())
}

// ── OpenAI TTS HD (fallback) ──────────────────────────────────────────────────
async function openaiTTS(text: string): Promise<Buffer | null> {
  if (!openai) return null
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',  // HD model — noticeably better than tts-1
      voice: 'onyx',       // deep warm male
      input: text,
      speed: 0.95,
    })
    return Buffer.from(await mp3.arrayBuffer())
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) return new Response('No text', { status: 400 })

  const clean = cleanText(text)

  // Try ElevenLabs first (best quality), fall back to OpenAI HD, then 204 for browser TTS
  const buffer = await elevenLabsTTS(clean) ?? await openaiTTS(clean)

  if (!buffer) {
    // No TTS keys — client will use browser speechSynthesis
    return new Response(null, { status: 204 })
  }

  return new Response(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
    },
  })
}
