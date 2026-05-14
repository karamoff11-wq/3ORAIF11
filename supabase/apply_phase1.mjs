import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const connectionString = 'postgresql://postgres.mbqonwwoazurvkxrffqx:Karam6969Karam@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  console.log('🚀 Connecting to Supabase...')
  await client.connect()
  console.log('✅ Connected.')

  const sqlPath = path.join(__dirname, 'phase_1_power_backend.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log('🔧 Applying Phase 1 optimizations...')
  
  // Split by semi-colon to run individual commands if needed, 
  // but pg.query can handle multiple statements in one block usually.
  try {
    await client.query(sql)
    console.log('✅ SQL Functions created successfully.')
    
    console.log('🔄 Reloading PostgREST cache...')
    await client.query("NOTIFY pgrst, 'reload schema';")
    console.log('✅ Cache reload triggered.')

    console.log('\n🎉 Phase 1 Backend Optimization is now LIVE!')
  } catch (err) {
    console.error('❌ Failed to apply optimizations:', err.message)
  } finally {
    await client.end()
  }
}

run()
