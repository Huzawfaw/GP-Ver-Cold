'use client'
import { useEffect, useState } from 'react'

const COMPANIES = (process.env.NEXT_PUBLIC_COMPANIES || 'connectiv,booksnpayroll')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

type AgentRow = {
  id: string
  email: string
  name: string
  extension: string
  available: boolean
  companies: string[]
  createdAt: string
}

export default function AdminAgents() {
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    extension: '',
    companies: new Set<string>()
  })
  const [busy, setBusy] = useState(false)

  async function load() {
    const r = await fetch('/api/admin/agents', { cache: 'no-store' })
    if (r.ok) {
      const data = await r.json()
      setAgents(data)
    } else {
      alert('Failed to load agents')
    }
  }
  useEffect(() => { load() }, [])

  function toggleCompany(c: string) {
    setForm(prev => {
      const s = new Set(prev.companies)
      s.has(c) ? s.delete(c) : s.add(c)
      return { ...prev, companies: s }
    })
  }

  async function createAgent() {
    setBusy(true)
    const payload = {
      email: form.email.trim(),
      name: form.name.trim(),
      password: form.password,
      extension: form.extension.trim(),
      companies: Array.from(form.companies)
    }
    const r = await fetch('/api/admin/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setBusy(false)
    if (r.ok) {
      setForm({ email: '', name: '', password: '', extension: '', companies: new Set() })
      await load()
    } else {
      const e = await r.json().catch(() => ({}))
      alert(e.error || 'Error creating agent')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin · Agents</h1>

      <div className="p-4 border rounded-2xl space-y-3">
        <h2 className="font-semibold">Create Agent</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="border rounded-xl px-3 py-2" placeholder="Email"
                 value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Name"
                 value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Password" type="password"
                 value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Extension (e.g. 1001)"
                 value={form.extension} onChange={e=>setForm({...form, extension:e.target.value})}/>
        </div>
        <div className="flex flex-wrap gap-3">
          {COMPANIES.map(c => (
            <label key={c} className="flex items-center gap-2 border rounded-xl px-3 py-2">
              <input type="checkbox"
                     checked={(form.companies as any).has?.(c)}
                     onChange={() => toggleCompany(c)} />
              {c}
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <button disabled={busy} onClick={createAgent} className="px-3 py-2 rounded-xl border">
            {busy ? 'Creating…' : 'Create Agent'}
          </button>
        </div>
      </div>

      <div className="border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Ext</th>
              <th className="p-2 text-left">Companies</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{a.email}</td>
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.extension}</td>
                <td className="p-2">{a.companies.join(', ')}</td>
                <td className="p-2">{a.available ? 'Available' : 'Busy'}</td>
                <td className="p-2">{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
