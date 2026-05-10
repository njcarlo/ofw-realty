import { NextRequest } from 'next/server'

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

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) return new Response('No text', { status: 400 })

  const apiKey = process.env.GOOGLE_TTS_API_KEY
  if (!apiKey) {
    console.log('[speak] No GOOGLE_TTS_API_KEY set — falling back to browser TTS')
    return new Response(null, { status: 204 })
  }

  const clean = cleanText(text)

  // Google Cloud Text-to-Speech REST API
  // Using WaveNet voice — en-PH-Wavenet-C (male, Filipino English)
  // Falls back to en-US-Neural2-D (deep male) if Filipino not available
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: clean },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Neural2-D',  // deep, warm male — best available
          ssmlGender: 'MALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.95,   // slightly slower — more authoritative
          pitch: -2.0,          // slightly lower pitch — warmer, deeper
          volumeGainDb: 1.0,
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('[Google TTS] Error:', res.status, err)
    return new Response(null, { status: 204 })
  }

  const { audioContent } = await res.json()
  if (!audioContent) {
    console.error('[Google TTS] No audioContent in response')
    return new Response(null, { status: 204 })
  }

  // Google returns base64-encoded MP3
  const buffer = Buffer.from(audioContent, 'base64')
  console.log('[Google TTS] Success — bytes:', buffer.length)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
    },
  })
}
