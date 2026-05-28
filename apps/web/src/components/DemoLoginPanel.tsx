'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useTheme } from './ThemeProvider'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DEMO_ACCOUNTS = [
  {
    role: 'Buyer (OFW)',
    userRole: 'buyer',
    icon: '🏠',
    email: 'buyer@demo.lupaph.com',
    password: 'Demo@12345',
    name: 'Maria OFW Buyer',
    desc: 'Browse properties, save listings, submit inquiries, SPA workflow',
    color: '#10B981',
    twColor: 'emerald',
    features: ['Browse & save properties', 'Submit inquiries', 'SPA workflow', 'Financing calculator'],
    portalName: 'Buyer Dashboard'
  },
  {
    role: 'Seller',
    userRole: 'seller',
    icon: '🏷️',
    email: 'seller@demo.lupaph.com',
    password: 'Demo@12345',
    name: 'Pedro Seller Reyes',
    desc: 'List your property, request agent representation, track inquiries',
    color: '#06B6D4',
    twColor: 'cyan',
    features: ['List properties', 'Pin on map', 'Request agent/broker', 'Track views & inquiries'],
    portalName: 'Seller Dashboard'
  },
  {
    role: 'Agent',
    userRole: 'realtor',
    icon: '👤',
    email: 'agent@demo.lupaph.com',
    password: 'Demo@12345',
    name: 'Juan Agent Santos',
    desc: 'Manage listings, handle leads, open houses, site visits',
    color: '#703BF7',
    twColor: 'purple',
    features: ['Manage listings', 'Lead dashboard', 'Open houses', 'Commission tracking'],
    portalName: 'Agent Portal'
  },
  {
    role: 'Broker',
    userRole: 'broker_admin',
    icon: '🏢',
    email: 'broker@demo.lupaph.com',
    password: 'Demo@12345',
    name: 'Ana Broker Cruz',
    desc: 'Manage brokerage, agents, property pool, commissions',
    color: '#F59E0B',
    twColor: 'amber',
    features: ['Manage agents', 'Property pool', 'Commission rates', 'Co-broking network'],
    portalName: 'Broker Portal'
  },
  {
    role: 'Developer',
    userRole: 'developer',
    icon: '🏗️',
    email: 'developer@demo.lupaph.com',
    password: 'Demo@12345',
    name: 'Carlo Dev Reyes',
    desc: 'Manage projects, units, broker network, reservations',
    color: '#8B5CF6',
    twColor: 'violet',
    features: ['Manage projects & units', 'Broker network', 'Reservations', 'Commission tracking'],
    portalName: 'Developer Portal'
  },
]

interface Props {
  onClose: () => void
}

export function DemoLoginPanel({ onClose }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVercel, setIsVercel] = useState(false)

  useEffect(() => {
    setIsVercel(window.location.hostname.includes('vercel.app'))
  }, [])

  const getPortalUrl = (role: string) => {
    const urls: Record<string, string> = {
      buyer: '/dashboard',
      seller: '/sell',
      realtor: process.env.NEXT_PUBLIC_AGENT_PORTAL_URL || (isVercel ? 'https://ofw-realty-agent-portal.vercel.app' : 'http://localhost:3002'),
      broker_admin: process.env.NEXT_PUBLIC_BROKER_PORTAL_URL || (isVercel ? 'https://ofw-realty-broker-portal.vercel.app' : 'http://localhost:3003'),
      developer: process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL || (isVercel ? 'https://ofw-realty-concierge-portal.vercel.app' : 'http://localhost:3005'), 
    };
    return urls[role] || '/dashboard';
  }

  async function loginAs(account: typeof DEMO_ACCOUNTS[0]) {
    setLoading(account.role)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      })
      if (error) throw error
      window.location.href = getPortalUrl(account.userRole)
    } catch (err: any) {
      setError(`Failed to login as ${account.role}: ${err.message}`)
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Panel */}
      <div 
        className={`relative z-[201] w-full max-w-6xl rounded-2xl p-6 sm:p-8 shadow-2xl transition-all ${
          isDark ? 'bg-zinc-950 border border-zinc-800' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-3">
              <span className="text-xs text-amber-500 font-semibold tracking-wide uppercase">🧪 Demo Mode — For Testing Only</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold m-0 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Choose a Demo Account
            </h2>
            <p className={`text-sm mt-2 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              Log in instantly to test the happy path for each user role without signing up.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-zinc-500 hover:bg-zinc-900 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Credentials info */}
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-6 border ${
          isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <span className="text-xl">🔑</span>
          <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
            All demo accounts use password:{' '}
            <code className={`px-2 py-1 rounded font-semibold ml-1 ${
              isDark ? 'bg-black text-white' : 'bg-gray-200 text-gray-900'
            }`}>
              Demo@12345
            </code>
          </span>
        </div>

        {/* Account cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {DEMO_ACCOUNTS.map(account => (
            <div 
              key={account.role} 
              className={`flex flex-col rounded-xl p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark 
                  ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Role header */}
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${account.color}15`, border: `1px solid ${account.color}30` }}
                >
                  {account.icon}
                </div>
                <div>
                  <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {account.role}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                    {account.name}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 mb-5 space-y-2">
                {account.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <div 
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" 
                      style={{ background: account.color }} 
                    />
                    <span className={`text-xs leading-snug ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              {/* Email */}
              <div className={`text-xs font-mono p-2 rounded-lg text-center mb-4 overflow-hidden text-ellipsis ${
                isDark ? 'bg-black/50 text-zinc-400' : 'bg-gray-100 text-gray-600'
              }`}>
                {account.email}
              </div>

              {/* Login button */}
              <button
                onClick={() => loginAs(account)}
                disabled={loading !== null}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all transform active:scale-95 disabled:scale-100 flex items-center justify-center shadow-lg"
                style={{
                  background: loading === account.role ? `${account.color}80` : account.color,
                  cursor: loading !== null ? 'not-allowed' : 'pointer',
                  boxShadow: `0 4px 14px 0 ${account.color}40`,
                }}
              >
                {loading === account.role ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  `Login as ${account.role}`
                )}
              </button>
              <div className={`text-[10px] text-center mt-3 font-medium flex flex-col gap-0.5 ${
                isDark ? 'text-zinc-500' : 'text-gray-400'
              }`}>
                <span>Redirects to:</span>
                <span style={{ color: account.color }}>{account.portalName}</span>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-500 font-medium m-0 flex items-center gap-2">
              ⚠️ {error}
            </p>
          </div>
        )}

        <p className={`text-xs text-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
          These are demo accounts for testing purposes only. Do not use real personal information.
        </p>
      </div>
    </div>
  )
}

