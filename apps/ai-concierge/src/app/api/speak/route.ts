import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) return new Response('No text', { status: 400 })

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
