/**
 * Apply a SQL file directly to the Supabase Postgres DB via pg.
 * Uses the Supabase pooler connection string (port 6543).
 *
 * Usage: node scripts/apply-migration.mjs <sql-file>
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'

const { Client } = pg
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY
const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!ref) { console.error('Could not extract project ref from URL'); process.exit(1) }

// Supabase direct DB connection (port 5432) — password is the service role key
const connectionString = `postgresql://postgres.${ref}:${serviceKey}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

const sqlFile = process.argv[2]
if (!sqlFile) { console.error('Usage: node scripts/apply-migration.mjs <sql-file>'); process.exit(1) }

const sql = readFileSync(resolve(sqlFile), 'utf8')
console.log(`Applying: ${sqlFile} (${sql.length} chars)`)

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(sql)
  console.log('✅ Done')
} catch (err) {
  console.error('❌ Error:', err.message)
} finally {
  await client.end()
}
