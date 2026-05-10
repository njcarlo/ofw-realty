import { NextRequest } from 'next/server'
import OpenAI from 'openai'

// TTS only available with OpenAI key — falls back to browser speechSynthesis on client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) return new Response('No text', { status: 400 })

  // If no OpenAI key, return 204 — client will use browser speechSynthesis
  if (!openai) return new Response(null, { status: 204 })

  // Strip markdown, emoji, and listing card placeholders for cleaner speech
  const clean = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/[#*_`~]/g, '')
    .replace(/₱/g, 'piso ')
    .replace(/→/g, '')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim()

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',   // warm, clear female voice — fits Listahan
    input: clean,
    speed: 1.05,
  })

  const buffer = Buffer.from(await mp3.arrayBuffer())

  return new Response(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
    },
  })
}
