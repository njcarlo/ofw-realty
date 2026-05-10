import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const path = formData.get('path') as string

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabase.storage
      .from('listing-photos')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Upload Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('listing-photos')
      .getPublicUrl(path)

    return NextResponse.json({ publicUrl: publicUrlData.publicUrl })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
