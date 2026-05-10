#!/usr/bin/env node
/**
 * Kill processes on dev ports before starting servers.
 * Works on Windows, Mac, and Linux.
 */
const { execSync } = require('child_process')

const PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008]

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(
        `netstat -ano | findstr :${port}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      )
      const lines = result.split('\n').filter(l => l.includes('LISTENING'))
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && pid !== '0') {
          try {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
            console.log(`✅ Killed PID ${pid} on port ${port}`)
          } catch {}
        }
      })
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' })
      console.log(`✅ Cleared port ${port}`)
    }
  } catch {
    // Port was already free
  }
}

console.log('🔪 Clearing dev ports...')
PORTS.forEach(killPort)
console.log('✅ All ports cleared. Starting servers...\n')
