/**
 * Run a SQL migration file against the remote Supabase project
 * using the service role key and the Supabase REST API (rpc exec).
 *
 * Usage: node scripts/run-migration.mjs <path-to-sql-file>
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envPath = join(__dirname, '../services/api/.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Usage: node scripts/run-migration.mjs <path-to-sql-file>')
  process.exit(1)
}

const sql = readFileSync(resolve(sqlFile), 'utf8')

console.log(`Running migration: ${sqlFile}`)
console.log(`SQL length: ${sql.length} chars\n`)

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ sql }),
})

if (!res.ok) {
  // Try the pg endpoint instead
  const text = await res.text()
  console.error('RPC failed:', text)

  // Fall back: use the Supabase Management API
  console.log('\nTrying Management API...')
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (!projectRef) { console.error('Could not extract project ref'); process.exit(1) }

  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  const mgmtText = await mgmtRes.text()
  console.log('Management API response:', mgmtRes.status, mgmtText.slice(0, 500))
} else {
  const data = await res.json()
  console.log('✅ Migration applied successfully')
  console.log(data)
}
