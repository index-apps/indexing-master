import { createClient } from '@supabase/supabase-js'

// এগুলো ভার্সেল সেটিংস থেকে অটোমেটিক আসবে
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // শুধু POST রিকোয়েস্ট গ্রহণ করবে
  if (req.method === 'POST') {
    const { title, url } = req.body

    // সুপাবেস টেবিলে ডেটা ইনসার্ট করা
    const { data, error } = await supabase
      .from('posts')
      .insert([{ title: title, url: url, indexed: false }])

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Post added successfully!', data })
  } else {
    // অন্য কোনো মেথড (যেমন GET) আসলে এরর দেখাবে
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
