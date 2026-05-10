'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import { ComposeBox } from '@/components/feed/ComposeBox'
import { PostCard } from '@/components/feed/PostCard'
import { RightPanel } from '@/components/feed/RightPanel'
import type { B2BPost, B2BProfile } from '@/lib/types'

export default function FeedPage() {
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<B2BProfile | null>(null)
  const [posts, setPosts] = useState<B2BPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const PAGE_SIZE = 10

  const fetchPosts = useCallback(async (profileId: string | null, offset = 0) => {
    const { data } = await supabase
      .from('b2b_posts')
      .select(`
        *,
        author:b2b_profiles!author_id(id, display_name, headline, avatar_url, prc_verified),
        listing:listings(id, title, price_php, city, province, property_type, lot_area_sqm,
          listing_photos(url, is_primary))
      `)
      .in('visibility', ['public', 'network'])
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (!data || data.length < PAGE_SIZE) setHasMore(false)

    if (!data) return []

    // Attach user reactions
    if (profileId && data.length > 0) {
      const ids = data.map(p => p.id)
      const { data: reactions } = await supabase
        .from('b2b_post_reactions')
        .select('post_id, reaction')
        .eq('profile_id', profileId)
        .in('post_id', ids)
      const rxMap = Object.fromEntries((reactions ?? []).map(r => [r.post_id, r.reaction]))
      return data.map(p => ({ ...p, user_reaction: rxMap[p.id] ?? null }))
    }
    return data.map(p => ({ ...p, user_reaction: null }))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }

      const { data: prof } = await supabase
        .from('b2b_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      setMyProfile(prof)

      const fetched = await fetchPosts(prof?.id ?? null, 0)
      setPosts(fetched)

      // Pending connection requests
      if (prof) {
        const { count } = await supabase
          .from('b2b_connections')
          .select('id', { count: 'exact', head: true })
          .eq('addressee_id', prof.id)
          .eq('status', 'pending')
        setPendingCount(count ?? 0)
      }

      setLoading(false)
    })
  }, [router, fetchPosts])

  // Realtime: new posts
  useEffect(() => {
    const channel = supabase
      .channel('b2b_feed')
      .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'b2b_posts' }, async (payload: any) => {
        // Fetch full post with author
        const { data } = await supabase
          .from('b2b_posts')
          .select(`*, author:b2b_profiles!author_id(id, display_name, headline, avatar_url, prc_verified), listing:listings(id, title, price_php, city, province, property_type, lot_area_sqm, listing_photos(url, is_primary))`)
          .eq('id', payload.new.id)
          .single()
        if (data) setPosts(prev => [{ ...data, user_reaction: null }, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const more = await fetchPosts(myProfile?.id ?? null, posts.length)
    setPosts(prev => [...prev, ...more])
    setLoadingMore(false)
  }

  function handleReacted(postId: string, reaction: string | null, delta: number) {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, user_reaction: reaction, reaction_count: p.reaction_count + delta }
        : p
    ))
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', alignItems: 'center', justifyContent: 'center', color: '#595959', fontFamily: 'Inter, sans-serif' }}>
      Loading feed…
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      {/* Left sidebar */}
      <Sidebar profile={myProfile ?? undefined} pendingCount={pendingCount} />

      {/* Center feed */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>

          {/* No profile banner */}
          {!myProfile && (
            <div style={{ background: 'rgba(112,59,247,0.08)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Set up your B2B profile</div>
                <div style={{ fontSize: 13, color: '#595959' }}>Create your profile to post and connect with other brokers.</div>
              </div>
              <a href="/profile/setup" style={{ background: '#703BF7', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, flexShrink: 0, boxShadow: '0 0 16px rgba(112,59,247,0.3)' }}>Set Up →</a>
            </div>
          )}

          {/* Compose */}
          {myProfile && <ComposeBox profile={myProfile} onPosted={post => setPosts(prev => [post, ...prev])} />}

          {/* Feed filter tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {['All Posts', 'Listings', 'Co-Broking', 'Market Insights'].map((tab, i) => (
              <button key={tab}
                style={{ padding: '6px 14px', borderRadius: 99, border: '1px solid #1A1A1A', background: i === 0 ? 'rgba(112,59,247,0.15)' : 'transparent', color: i === 0 ? '#703BF7' : '#595959', fontSize: 12, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Posts */}
          {posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#595959' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Walang posts pa</div>
              <div style={{ fontSize: 14 }}>Maging una sa pag-share ng update sa network.</div>
            </div>
          )}

          {posts.map(post => (
            <PostCard key={post.id} post={post} myProfile={myProfile} onReacted={handleReacted} />
          ))}

          {/* Load more */}
          {hasMore && posts.length > 0 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <button onClick={loadMore} disabled={loadingMore}
                style={{ background: '#0D0D0D', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '10px 28px', fontSize: 13, fontWeight: 600, cursor: loadingMore ? 'not-allowed' : 'pointer' }}>
                {loadingMore ? 'Loading…' : 'Load More Posts'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Right panel */}
      <aside style={{ width: 300, padding: '24px 16px', flexShrink: 0, overflowY: 'auto' }}>
        <RightPanel myProfile={myProfile} />
      </aside>
    </div>
  )
}
