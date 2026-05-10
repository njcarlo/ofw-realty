'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'

type CallState = 'idle' | 'calling' | 'connected' | 'listening' | 'thinking' | 'speaking'

interface Listing {
  id: string
  title: string
  property_type: string
  price_php: number
  city: string
  province: string
  lot_area_sqm: number
  is_featured: boolean
  blockchain_verified: boolean
  listing_photos: { url: string; is_primary: boolean }[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  listings?: Listing[]
}

function formatPHP(n: number) {
  if (n >= 1_000_000) return `\u20B1${(n / 1_000_000).toFixed(1)}M`
  return `\u20B1${(n / 1000).toFixed(0)}K`
}

function SoundWave({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 32 }}>
      {[1,2,3,4,5,6,7].map(i => (
        <div key={i} style={{
          width: 3, borderRadius: 99,
          background: active ? '#703BF7' : '#262626',
          height: active ? undefined : 6,
          animation: active ? `soundwave 0.8s ease-in-out ${i * 0.08}s infinite alternate` : 'none',
          minHeight: 4,
        }} />
      ))}
      <style>{`@keyframes soundwave { from { height: 4px; } to { height: 28px; } }`}</style>
    </div>
  )
}

function PulseRing({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(112,59,247,0.5)', animation: 'pulse-ring 1.2s ease-out infinite' }}>
      <style>{`@keyframes pulse-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }`}</style>
    </div>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const photo = listing.listing_photos?.find(p => p.is_primary) ?? listing.listing_photos?.[0]
  return (
    <a href={`${WEB_URL}/listings/${listing.id}`} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', flexDirection: 'column', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden', minWidth: 180, maxWidth: 200, flexShrink: 0, textDecoration: 'none' }}>
      <div style={{ height: 90, background: '#141414', position: 'relative' }}>
        {photo && <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        {listing.is_featured && <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 9, fontWeight: 700, background: '#703BF7', color: '#fff', padding: '2px 5px', borderRadius: 99 }}>⭐ Featured</span>}
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</div>
        <div style={{ fontSize: 11, color: '#595959', marginBottom: 4 }}>📍 {listing.city}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#703BF7' }}>{formatPHP(listing.price_php)}</div>
      </div>
    </a>
  )
}

export default function ListahanCallAgent() {
  const [callState, setCallState] = useState<CallState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState('')
  const [showChat, setShowChat] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [useBrowserTTS, setUseBrowserTTS] = useState(false)

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (['connected','listening','thinking','speaking'].includes(callState)) {
      callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      if (callState === 'idle') setCallDuration(0)
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current) }
  }, [callState])

  function formatDuration(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  }

  const speakBrowser = useCallback((text: string) => {
    return new Promise<void>(resolve => {
      const clean = text.replace(/[*_`#]/g, '').replace(/₱/g, 'piso ').trim()
      const utt = new SpeechSynthesisUtterance(clean)
      utt.lang = 'fil-PH'
      utt.rate = 1.05
      utt.onend = () => resolve()
      utt.onerror = () => resolve()
      window.speechSynthesis.speak(utt)
    })
  }, [])

  const speak = useCallback(async (text: string) => {
    setCallState('speaking')
    try {
      if (useBrowserTTS) {
        await speakBrowser(text)
      } else {
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        if (res.status === 204 || !res.ok) {
          setUseBrowserTTS(true)
          await speakBrowser(text)
        } else {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => { URL.revokeObjectURL(url); resolve() }
            audio.onerror = reject
            audio.play()
          })
        }
      }
    } catch { await speakBrowser(text) }
    setCallState('listening')
    startListening()
  }, [useBrowserTTS, speakBrowser])

  const sendMessage = useCallback(async (text: string, history: Message[]) => {
    if (!text.trim()) return
    setCallState('thinking')
    setTranscript('')

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() }
    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }])

    const apiHistory = [...history, userMsg].map(m => ({ role: m.role, content: m.content }))
    abortRef.current = new AbortController()

    let fullText = ''
    let listings: Listing[] = []

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistory }),
        signal: abortRef.current.signal,
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'token') {
              fullText += event.token
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m))
            } else if (event.type === 'listings') {
              listings = event.listings
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, listings } : m))
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      fullText = 'Pasensya na po, may nangyaring error. Subukan ulit.'
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m))
    }

    await speak(fullText)
  }, [speak])

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setCallState('connected'); return }

    const recognition = new SR()
    recognition.lang = 'fil-PH'
    recognition.interimResults = true
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onstart = () => { setCallState('listening') }

    recognition.onresult = (e: any) => {
      const interim = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setTranscript(interim)
      if (e.results[e.results.length - 1].isFinal) {
        const final = e.results[e.results.length - 1][0].transcript
        recognition.stop()
        setMessages(prev => { sendMessage(final, prev); return prev })
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'no-speech') setTimeout(() => startListening(), 1500)
    }

    recognition.onend = () => {
      setCallState(s => { if (s === 'listening') setTimeout(() => startListening(), 800); return s })
    }

    recognition.start()
  }, [sendMessage])

  async function startCall() {
    setCallState('calling')
    setMessages([])
    setTranscript('')
    await new Promise(r => setTimeout(r, 2000))
    setCallState('connected')

    const greeting = 'Hello po! Listahan AI ito. Kumusta? Paano kita matutulungan ngayon?'
    const welcomeMsg: Message = { id: 'welcome', role: 'assistant', content: greeting }
    setMessages([welcomeMsg])
    await speak(greeting)
  }

  function endCall() {
    abortRef.current?.abort()
    recognitionRef.current?.stop()
    audioRef.current?.pause()
    window.speechSynthesis?.cancel()
    setCallState('idle')
    setTranscript('')
  }

  const isInCall = !['idle', 'calling'].includes(callState)

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, borderBottom: '1px solid #1A1A1A', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>LUPA <span style={{ color: '#703BF7' }}>PH</span></div>
          <div style={{ width: 1, height: 16, background: '#1A1A1A' }} />
          <div style={{ fontSize: 13, color: '#595959' }}>Listahan AI</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isInCall && (
            <button onClick={() => setShowChat(v => !v)}
              style={{ fontSize: 12, color: showChat ? '#703BF7' : '#595959', background: showChat ? 'rgba(112,59,247,0.1)' : 'transparent', border: `1px solid ${showChat ? 'rgba(112,59,247,0.3)' : '#1A1A1A'}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
              💬 {showChat ? 'Hide' : 'Show'} Transcript
            </button>
          )}
          <a href={WEB_URL} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '6px 12px' }}>
            Browse Listings ↗
          </a>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Call screen */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <PulseRing active={callState === 'listening'} />
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: callState === 'idle' ? 'linear-gradient(135deg,#1A1A1A,#0D0D0D)' : 'linear-gradient(135deg,#703BF7,#9B6DFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
              boxShadow: callState === 'idle' ? 'none' : '0 0 60px rgba(112,59,247,0.4)',
              transition: 'all 0.4s ease',
              border: `3px solid ${callState === 'idle' ? '#1A1A1A' : 'rgba(112,59,247,0.5)'}`,
            }}>🤖</div>
            {callState === 'calling' && (
              <>
                <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '2px solid rgba(112,59,247,0.3)', animation: 'pulse-ring 1.5s ease-out 0s infinite' }} />
                <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', border: '2px solid rgba(112,59,247,0.15)', animation: 'pulse-ring 1.5s ease-out 0.3s infinite' }} />
              </>
            )}
          </div>

          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Listahan AI</div>
          <div style={{ fontSize: 13, color: '#595959', marginBottom: 20 }}>Lista ng Broker. Listahan ng Tiwala.</div>

          {isInCall && <div style={{ fontSize: 22, fontWeight: 700, color: '#703BF7', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{formatDuration(callDuration)}</div>}

          <div style={{ fontSize: 14, color: '#595959', marginBottom: 28, minHeight: 20, textAlign: 'center' }}>
            {callState === 'idle' && 'I-tap ang call button para makausap si Listahan'}
            {callState === 'calling' && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'blink 1s step-end infinite' }} />Tumatawag…</span>}
            {callState === 'connected' && <span style={{ color: '#10B981' }}>● Konektado</span>}
            {callState === 'listening' && <span style={{ color: '#703BF7' }}>🎙 Nakikinig…</span>}
            {callState === 'thinking' && <span style={{ color: '#F59E0B' }}>⏳ Nag-iisip…</span>}
            {callState === 'speaking' && <span style={{ color: '#10B981' }}>🔊 Nagsasalita…</span>}
          </div>

          <div style={{ marginBottom: 32 }}><SoundWave active={callState === 'speaking'} /></div>

          {transcript && (
            <div style={{ background: 'rgba(112,59,247,0.08)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: '10px 18px', marginBottom: 24, maxWidth: 400, textAlign: 'center', fontSize: 14, color: '#ccc', fontStyle: 'italic' }}>
              "{transcript}"
            </div>
          )}

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {callState === 'idle' ? (
              <button onClick={startCall}
                style={{ width: 72, height: 72, borderRadius: '50%', background: '#10B981', border: 'none', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(16,185,129,0.5)' }}
                aria-label="Start call">📞</button>
            ) : (
              <button onClick={endCall}
                style={{ width: 72, height: 72, borderRadius: '50%', background: '#EF4444', border: 'none', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(239,68,68,0.4)' }}
                aria-label="End call">📵</button>
            )}
          </div>

          {callState === 'idle' && (
            <div style={{ marginTop: 32, fontSize: 12, color: '#333', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
              Kausapin si Listahan sa Filipino o English.<br />
              Para sa mga broker, listings, at referrals sa Pilipinas.
            </div>
          )}
        </div>

        {/* Transcript panel */}
        {showChat && isInCall && (
          <div style={{ width: 380, borderLeft: '1px solid #1A1A1A', display: 'flex', flexDirection: 'column', background: '#050505' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1A1A1A', fontSize: 13, fontWeight: 600, color: '#fff' }}>
              Transcript ng Tawag
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                  <div style={{ fontSize: 11, color: '#595959' }}>{msg.role === 'user' ? 'Ikaw' : 'Listahan AI'}</div>
                  <div style={{
                    maxWidth: '85%', padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                    background: msg.role === 'user' ? '#703BF7' : '#141414',
                    border: msg.role === 'user' ? 'none' : '1px solid #1A1A1A',
                    fontSize: 13, color: '#fff', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>…</span>}
                  </div>
                  {msg.listings && msg.listings.length > 0 && (
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: 11, color: '#595959', marginBottom: 8 }}>{msg.listings.length} listing{msg.listings.length !== 1 ? 's' : ''} found</div>
                      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                        {msg.listings.map(l => <ListingCard key={l.id} listing={l} />)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.5);opacity:0} }
      `}</style>
    </div>
  )
}
