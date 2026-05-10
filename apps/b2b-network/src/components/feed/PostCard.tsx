'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { B2BPost, B2BProfile } from '@/lib/types'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'

const POST_TYPE_CFG: Record<string, { label: string; color: string; icon: string }> = {
  update:             { label: 'Update',         color: '#595959', icon: '📝' },
  listing_share:      { label: 'Listing Share',  color: '#703BF7', icon: '🏘️' },
  service_offer:      { label: 'Service Offer',  color: '#06B6D4', icon: '🛠️' },
  market_insight:     { label: 'Market Insight', color: '#10B981', icon: '📊' },
  co_broking_request: { label: 'Co-Broking',     color: '#F59E0B', icon: '🤝' },
}

const REACTIONS = [
  { key: 'like',       emoji: '👍', label: 'Like' },
  { key: 'insightful', emoji: '💡', label: 'Insightful' },
  { key: 'celebrate',  emoji: '🎉', label: 'Celebrate' },
  { key: 'support',    emoji: '🤲', label: 'Support' },
]

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  return `₱${(n / 1000).toFixed(0)}K`
}

interface Props {
  post: B2BPost
  myProfile: B2BProfile | null
  onReacted: (postId: string, reaction: string | null, delta: number) => void
}

export function PostCard({ post, myProfile, onReacted }: Props) {
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  const typeCfg = POST_TYPE_CFG[post.post_type] ?? POST_TYPE_CFG.update

  async function handleReact(reaction: string) {
    if (!myProfile) return
    setShowReactionPicker(false)

    if (post.user_reaction === reaction) {
      // remove
      await supabase.from('b2b_post_reactions')
        .delete().eq('post_id', post.id).eq('profile_id', myProfile.id)
      onReacted(post.id, null, -1)
    } else {
      // upsert
      await supabase.from('b2b_post_reactions')
        .upsert({ post_id: post.id, profile_id: myProfile.id, reaction }, { onConflict: 'post_id,profile_id' })
      onReacted(post.id, reaction, post.user_reaction ? 0 : 1)
    }
  }

  async function loadComments() {
    if (loadingComments) return
    setLoadingComments(true)
    const { data } = await supabase
      .from('b2b_comments')
      .select('*, author:b2b_profiles!author_id(id, display_name, avatar_url, prc_verified)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(20)
    setComments(data ?? [])
    setLoadingComments(false)
  }

  async function toggleComments() {
    if (!showComments && comments.length === 0) await loadComments()
    setShowComments(v => !v)
  }

  async function submitComment() {
    if (!commentText.trim() || !myProfile) return
    setSubmittingComment(true)
    const { data } = await supabase.from('b2b_comments').insert({
      post_id: post.id,
      author_id: myProfile.id,
      content: commentText.trim(),
    }).select('*, author:b2b_profiles!author_id(id, display_name, avatar_url, prc_verified)').single()
    if (data) {
      setComments(prev => [...prev, data])
      setCommentText('')
    }
    setSubmittingComment(false)
  }

  return (
    <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px 12px' }}>
        <a href={`/profile/${post.author_id}`} style={{ flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', border: '2px solid rgba(112,59,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden' }}>
            {post.author?.avatar_url
              ? <img src={post.author.avatar_url} style={{ width: 44, height: 44, objectFit: 'cover' }} alt="" />
              : '👤'}
          </div>
        </a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <a href={`/profile/${post.author_id}`} style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {post.author?.display_name ?? 'Broker'}
            </a>
            {post.author?.prc_verified && (
              <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>✓ PRC</span>
            )}
            <span style={{ fontSize: 11, background: `${typeCfg.color}20`, color: typeCfg.color, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
              {typeCfg.icon} {typeCfg.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>
            {post.author?.headline ?? 'Real Estate Professional'} · {formatRelative(post.created_at)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 18px 14px' }}>
        <p style={{ fontSize: 14, color: '#ddd', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{post.content}</p>
      </div>

      {/* Linked listing card */}
      {post.listing && (
        <a href={`${WEB_URL}/listings/${post.listing.id}`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', gap: 12, background: '#141414', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '12px 18px', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
          onMouseLeave={e => (e.currentTarget.style.background = '#141414')}
        >
          <div style={{ width: 80, height: 60, borderRadius: 8, background: '#0D0D0D', overflow: 'hidden', flexShrink: 0 }}>
            {post.listing.listing_photos?.[0] && (
              <img src={post.listing.listing_photos[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.listing.title}</div>
            <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>📍 {post.listing.city}, {post.listing.province}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#703BF7' }}>{formatPHP(post.listing.price_php)}</span>
              {post.listing.lot_area_sqm && <span style={{ fontSize: 11, color: '#595959' }}>{post.listing.lot_area_sqm} sqm</span>}
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#703BF7', alignSelf: 'center', flexShrink: 0 }}>View →</div>
        </a>
      )}

      {/* Reaction summary */}
      {post.reaction_count > 0 && (
        <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {['👍','💡','🎉'].map(e => <span key={e} style={{ fontSize: 13 }}>{e}</span>)}
          </div>
          <span style={{ fontSize: 12, color: '#595959' }}>{post.reaction_count}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#595959' }}>
            {post.comment_count > 0 && `${post.comment_count} comment${post.comment_count !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', borderTop: '1px solid #141414', margin: '8px 0 0' }}>
        {/* React button */}
        <div style={{ flex: 1, position: 'relative' }}>
          <button
            onClick={() => setShowReactionPicker(v => !v)}
            style={{ width: '100%', padding: '10px 0', background: 'none', border: 'none', color: post.user_reaction ? '#703BF7' : '#595959', fontSize: 13, fontWeight: post.user_reaction ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            {post.user_reaction ? REACTIONS.find(r => r.key === post.user_reaction)?.emoji : '👍'}
            <span>{post.user_reaction ? REACTIONS.find(r => r.key === post.user_reaction)?.label : 'React'}</span>
          </button>
          {showReactionPicker && (
            <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#1A1A1A', border: '1px solid #262626', borderRadius: 12, padding: '8px 10px', display: 'flex', gap: 6, zIndex: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {REACTIONS.map(r => (
                <button key={r.key} onClick={() => handleReact(r.key)} title={r.label}
                  style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 8, transition: 'transform 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >{r.emoji}</button>
              ))}
            </div>
          )}
        </div>

        {/* Comment button */}
        <button onClick={toggleComments}
          style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderLeft: '1px solid #141414', color: showComments ? '#703BF7' : '#595959', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          💬 <span>Comment</span>
        </button>

        {/* Share button */}
        <button
          style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderLeft: '1px solid #141414', color: '#595959', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          🔗 <span>Share</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ borderTop: '1px solid #141414', padding: '12px 18px', background: '#080808' }}>
          {loadingComments && <div style={{ fontSize: 13, color: '#595959', padding: '8px 0' }}>Loading comments…</div>}
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, overflow: 'hidden' }}>
                {c.author?.avatar_url ? <img src={c.author.avatar_url} style={{ width: 32, height: 32, objectFit: 'cover' }} alt="" /> : '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ background: '#141414', borderRadius: '4px 14px 14px 14px', padding: '8px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.author?.display_name}
                    {c.author?.prc_verified && <span style={{ fontSize: 9, color: '#10B981' }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.5 }}>{c.content}</div>
                </div>
                <div style={{ fontSize: 11, color: '#595959', marginTop: 3, paddingLeft: 4 }}>{formatRelative(c.created_at)}</div>
              </div>
            </div>
          ))}

          {/* Comment input */}
          {myProfile && (
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, overflow: 'hidden' }}>
                {myProfile.avatar_url ? <img src={myProfile.avatar_url} style={{ width: 32, height: 32, objectFit: 'cover' }} alt="" /> : '👤'}
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitComment())}
                  placeholder="Write a comment…"
                  style={{ flex: 1, background: '#141414', border: '1px solid #262626', borderRadius: 20, padding: '7px 14px', fontSize: 13, color: '#fff', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')}
                  onBlur={e => (e.target.style.borderColor = '#262626')}
                />
                <button onClick={submitComment} disabled={submittingComment || !commentText.trim()}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: commentText.trim() ? '#703BF7' : '#1A1A1A', border: 'none', color: commentText.trim() ? '#fff' : '#595959', fontSize: 14, cursor: commentText.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                  ➤
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
