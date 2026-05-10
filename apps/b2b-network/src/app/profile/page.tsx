'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MyProfileRedirect() {
  const router = useRouter()
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('b2b_profiles').select('id').eq('user_id', data.session.user.id).maybeSingle()
      if (prof) router.replace(`/profile/${prof.id}`)
      else router.replace('/profile/setup')
    })
  }, [router])
  return <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#595959', fontFamily: 'Inter, sans-serif' }}>Loading…</div>
}
