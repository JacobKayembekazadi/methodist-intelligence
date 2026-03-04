import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Clock, Users, Brain, Activity } from 'lucide-react'

const SUPABASE_URL = 'https://rauweyruhjficjnpkcjo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdXdleXJ1aGpmaWNqbnBrY2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTMyNTIsImV4cCI6MjA4MTU2OTI1Mn0.Ociw-ygIY4lGgpniCZvQFOMPjmHwSZAK5Wqaj65Fzp0'

interface Department {
  id: number
  name: string
  specialty_count: number
  staff_count: number
  ai_tool: string
  adoption_rate: number
  trend: 'rising' | 'stable' | 'declining'
  docs_hours_saved: number
  last_training: string
  risk_level: 'low' | 'medium' | 'high'
  flag_reason: string | null
}

interface Alert {
  id: number
  department: string
  alert_type: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  created_at: string
  resolved: boolean
}

async function fetchSupabase(table: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })
  return res.json()
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising') return <TrendingUp size={14} style={{ color: '#1D4ED8', display: 'inline' }} />
  if (trend === 'declining') return <TrendingDown size={14} style={{ color: '#ef4444', display: 'inline' }} />
  return <Minus size={14} style={{ color: '#64748B', display: 'inline' }} />
}

function adoptionColor(rate: number) {
  if (rate >= 80) return '#1D4ED8'
  if (rate >= 50) return '#d97706'
  return '#ef4444'
}

export default function App() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [geminiInsight, setGeminiInsight] = useState<string>('')
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [clock, setClock] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    Promise.all([fetchSupabase('houston_methodist_departments'), fetchSupabase('houston_methodist_alerts')]).then(
      ([depts, alts]) => {
        setDepartments(Array.isArray(depts) ? depts : [])
        setAlerts(Array.isArray(alts) ? alts : [])
        setLoading(false)
      }
    )
  }, [])

  useEffect(() => {
    if (departments.length === 0) return
    setGeminiLoading(true)
    const deptSummary = departments.map(d => `${d.name}: ${d.adoption_rate}% (${d.trend}, risk: ${d.risk_level}${d.flag_reason ? ', ' + d.flag_reason : ''})`).join('\n')
    const alertSummary = alerts.filter(a => !a.resolved).slice(0, 5).map(a => `[${a.severity}] ${a.department}: ${a.message}`).join('\n')
    const prompt = `You are advising Houston Methodist Hospital leadership. Based on this AI adoption data, identify the SINGLE most important intervention this week. Be specific (name the department, the action, the expected outcome). Keep response under 120 words.

DEPARTMENTS:\n${deptSummary}\n\nACTIVE ALERTS:\n${alertSummary}`

    fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      .then(r => r.json())
      .then(data => setGeminiInsight(data.text ?? ''))
      .catch(() => setGeminiInsight('Insight unavailable.'))
      .finally(() => setGeminiLoading(false))
  }, [departments, alerts])

  const criticalAlerts = alerts.filter(a => !a.resolved && a.severity === 'critical')
  const unresolved = alerts.filter(a => !a.resolved).sort((a) => (a.severity === 'critical' ? -1 : 1))
  const avgAdoption = departments.length ? (departments.reduce((s, d) => s + d.adoption_rate, 0) / departments.length).toFixed(1) : '—'
  const totalHours = departments.reduce((s, d) => s + (d.docs_hours_saved || 0), 0)
  const atRisk = departments.filter(d => d.risk_level === 'high').length
  const sorted = [...departments].sort((a, b) => b.adoption_rate - a.adoption_rate)

  const gold = '#1D4ED8'
  const card = { backgroundColor: '#FFFFFF', border: '1px solid #F1F5F9' }
  const sectionHeader = {
    color: '#F5F5F5',
    fontFamily: 'Inter, sans-serif',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    borderLeft: `3px solid ${gold}`,
    paddingLeft: '10px',
  }

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '16px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Inter, serif', color: gold, fontSize: '22px', fontWeight: 600, margin: 0 }}>
              HOUSTON METHODIST
            </h1>
            <p style={{ color: '#475569', fontSize: '13px', margin: '2px 0 0 0' }}>AI Adoption Intelligence</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#64748B', fontSize: '9px', margin: 0 }}>Center for Innovation</p>
            <p style={{ color: '#64748B', fontSize: '9px', margin: 0 }}>Ion District Demo</p>
            <p style={{ color: gold, fontSize: '11px', margin: '4px 0 0 0', fontVariantNumeric: 'tabular-nums' }}>
              {clock.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalAlerts.length > 0 && (
        <div style={{ backgroundColor: '#1a0505', border: '1px solid #7f1d1d', padding: '10px 14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={14} color="#ef4444" />
            <span style={{ color: '#ef4444', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
              Immediate Action Required
            </span>
            <span style={{ color: '#ef4444', fontSize: '9px', marginLeft: 'auto' }}>{criticalAlerts.length} critical</span>
          </div>
          <p style={{ color: '#fca5a5', fontSize: '12px', margin: '6px 0 0 0' }}>{criticalAlerts[0].message}</p>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: 'Departments', value: loading ? '…' : String(departments.length), icon: <Activity size={14} color={gold} /> },
          { label: 'System Adoption', value: loading ? '…' : `${avgAdoption}%`, icon: <Brain size={14} color={gold} />, gold: true },
          { label: 'Hours Saved / Mo', value: loading ? '…' : totalHours.toLocaleString(), icon: <Clock size={14} color={gold} /> },
          { label: 'At-Risk Depts', value: loading ? '…' : String(atRisk), icon: <Users size={14} color="#ef4444" />, red: true },
        ].map((m, i) => (
          <div key={i} style={{ ...card, padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#64748B', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.label}</span>
              {m.icon}
            </div>
            <p style={{ color: m.gold ? gold : m.red ? '#ef4444' : '#F5F5F5', fontSize: '28px', fontWeight: 600, margin: 0, fontFamily: 'Inter, sans-serif' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Adoption Leaderboard */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ ...sectionHeader, marginBottom: '12px' }}>Adoption Leaderboard</p>
        <div style={{ ...card, padding: '16px' }}>
          {loading ? (
            <p style={{ color: '#555', textAlign: 'center', fontSize: '13px' }}>Loading…</p>
          ) : (
            <ResponsiveContainer width="100%" height={sorted.length * 36}>
              <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #F1F5F9', color: '#F5F5F5', fontSize: '12px' }}
                  formatter={(val) => val !== undefined ? [`${val}%`, "Adoption"] : ["—", "Adoption"]}
                />
                <Bar dataKey="adoption_rate" radius={0}>
                  {sorted.map((d, i) => (
                    <Cell key={i} fill={adoptionColor(d.adoption_rate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* Legend row */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
            {[{ color: gold, label: '>80% On track' }, { color: '#d97706', label: '50-80% Watch' }, { color: '#ef4444', label: '<50% At risk' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: 10, height: 10, backgroundColor: l.color }} />
                <span style={{ color: '#64748B', fontSize: '10px' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Cards */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ ...sectionHeader, marginBottom: '12px' }}>Department Details</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sorted.map(d => (
            <div key={d.id} style={{ ...card, padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <p style={{ color: '#F5F5F5', fontWeight: 600, margin: 0, fontSize: '14px' }}>{d.name}</p>
                  <span style={{ backgroundColor: '#1a1500', border: `1px solid ${gold}`, color: gold, fontSize: '9px', padding: '2px 7px', display: 'inline-block', marginTop: '4px', letterSpacing: '0.05em' }}>
                    {d.ai_tool}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: adoptionColor(d.adoption_rate), fontSize: '26px', fontWeight: 700, margin: 0, lineHeight: 1 }}>
                    {d.adoption_rate}%
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '3px' }}>
                    <TrendIcon trend={d.trend} />
                    <span style={{ fontSize: '10px', color: d.trend === 'rising' ? gold : d.trend === 'declining' ? '#ef4444' : '#64748B' }}>
                      {d.trend}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#64748B', marginBottom: d.flag_reason ? '8px' : 0 }}>
                <span>{d.staff_count} staff</span>
                <span>{d.docs_hours_saved} hrs saved/mo</span>
                <span>Trained: {d.last_training ? new Date(d.last_training).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</span>
              </div>
              {d.risk_level === 'high' && d.flag_reason && (
                <div style={{ backgroundColor: '#1a0505', border: '1px solid #7f1d1d', padding: '6px 10px', marginTop: '8px' }}>
                  <span style={{ color: '#fca5a5', fontSize: '11px' }}>⚠ {d.flag_reason}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ ...sectionHeader, marginBottom: '12px' }}>Active Alerts</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {unresolved.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '13px', padding: '12px' }}>No active alerts</p>
          ) : unresolved.map(a => (
            <div key={a.id} style={{
              ...card,
              padding: '10px 14px',
              borderLeft: `3px solid ${a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#d97706' : '#64748B'}`,
              backgroundColor: a.severity === 'critical' ? '#0d0404' : '#FFFFFF',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: '#F5F5F5', fontSize: '12px', fontWeight: 500 }}>{a.department}</span>
                <span style={{ color: '#64748B', fontSize: '10px' }}>{timeAgo(a.created_at)}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>{a.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ ...card, border: `1px solid ${gold}`, padding: '16px' }}>
          <p style={{ color: gold, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
            ◆ AI INSIGHT — Gemini
          </p>
          {geminiLoading ? (
            <p style={{ color: '#64748B', fontSize: '13px' }}>Analyzing adoption patterns…</p>
          ) : geminiInsight ? (
            <p style={{ color: '#F5F5F5', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{geminiInsight}</p>
          ) : (
            <p style={{ color: '#64748B', fontSize: '13px' }}>Insight will appear once data loads.</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <p style={{ color: '#94A3B8', fontSize: '10px', textAlign: 'center' }}>
        Powered by Sloe Labs · Real-time Houston Methodist sensor data
      </p>
    </div>
  )
}
