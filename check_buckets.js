const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://eewdelfbvkdgbiovsbvr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVld2RlbGZidmtkZ2Jpb3ZzYnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjE5MjksImV4cCI6MjA5MTYzNzkyOX0.QxZeQrDzusrN9097ZQQuzah0EjhUzdozsVX-1owXr2U');

const fileBuffer = Buffer.from('hello world');
supabase.storage.from('listing-photos').upload('anonymous/test.png', fileBuffer, { contentType: 'image/png', upsert: true }).then(res => {
  console.log("Upload response:", JSON.stringify(res, null, 2));
});
