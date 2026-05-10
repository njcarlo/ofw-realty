'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { B2BProfile, B2BPost } from '@/lib/types'

const POST_TYPES: { key: B2BPost['post_type']; icon: string; label: string; color: string }[] = [
  { key: 'update',             icon: '📝', label: 'Update',         color: '#595959' },
  { key: 'listing_share',      icon: '🏘️', label: 'Listing',        color: '#703BF7' },
  { key: 'co_broking_request', icon: '🤝', label: 'Co-Broking',     color: '#F59E0B' },
  { key: 'market_insight',     icon: '📊', label: 'Market Insight', color: '#10B981' },
  { key: 'service_offer',      icon: '🛠️', label: 'Service',        color: '#06B6D4' },
]

interface Props {
  profile: B2BProfile
  onPosted: (post: B2BPost) => void
}

export function ComposeBox({ profile, onPosted }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [postType, setPostType] = useState<B2BPost['post_type']>('update')
  const [submitting, setSubmitting] = useState(false)

  async function handlePost() {
    if (!text.trim()) return
    setSubmitting(true)
    const { data } = await supabase
      .from('b2b_posts')
      .insert({
        author_id: profile.id,
        content: text.trim(),
        post_type: postType,
        visibility: 'public',
        reaction_count: 0,
        comment_count: 0,
        share_count: 0,
      })
      .select('*, author:b2b_profiles!author_id(id, display_name, headline, avatar_url, prc_verified)')
      .single()

    if (data) {
      onPosted({ ...data, user_reaction: null })
      setText('')
      setPostType('update')
      setExpanded(false)
      // bump post count
      await supabase.from('b2b_profiles')
        .update({ post_count: (profile.post_count ?? 0) + 1 })
        .eq('id', profile.id)
    }
    setSubmitting(false)
  }

  return (
    <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Avatar */}
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', border: '2px solid rgba(112,59,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} style={{ width: 42, height: 42, objectFit: 'cover' }} alt="" />
            : '👤'}
        </div>

        {/* Input */}
        <div style={{ flex: 1 }}>
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 22, padding: '10px 18px', fontSize: 14, color: '#595959', cursor: 'text', textAlign: 'left' }}
            >
              Mag-share ng update, listing, o co-broking opportunity…
            </button>
          ) : (
            <>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Mag-share ng update, listing, o co-broking opportunity…"
                rows={4}
                style={{ width: '100%', background: '#141414', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#fff', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
              />

              {/* Post type selector */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {POST_TYPES.map(t => (
                  <button key={t.key} onClick={() => setPostType(t.key)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, border: `1px solid ${postType === t.key ? t.color : '#1A1A1A'}`, background: postType === t.key ? `${t.color}20` : 'transparent', color: postType === t.key ? t.color : '#595959', cursor: 'pointer', fontWeight: 600 }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button onClick={() => { setExpanded(false); setText('') }}
                  style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handlePost} disabled={submitting || !text.trim()}
                  style={{ background: submitting || !text.trim() ? '#1A1A1A' : '#703BF7', color: submitting || !text.trim() ? '#595959' : '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: submitting || !text.trim() ? 'not-allowed' : 'pointer', boxShadow: submitting || !text.trim() ? 'none' : '0 0 16px rgba(112,59,247,0.3)' }}>
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick action buttons (collapsed state) */}
      {!expanded && (
        <div style={{ display: 'flex', gap: 4, marginTop: 12, paddingTop: 12, borderTop: '1px solid #141414' }}>
          {POST_TYPES.slice(1).map(t => (
            <button key={t.key} onClick={() => { setPostType(t.key); setExpanded(true) }}
              style={{ flex: 1, padding: '7px 4px', background: 'transparent', border: '1px solid #1A1A1A', borderRadius: 8, color: '#595959', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = t.color; (e.currentTarget as HTMLElement).style.color = t.color }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1A1A1A'; (e.currentTarget as HTMLElement).style.color = '#595959' }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
