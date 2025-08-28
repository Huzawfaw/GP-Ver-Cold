'use client'
import { useState } from 'react'


export default function Login(){
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [loading, setLoading] = useState(false)


async function onLogin(){
setLoading(true)
const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
setLoading(false)
if(res.ok){
location.href = '/dialer'
} else {
alert('Login failed')
}
}


return (
<div className="max-w-md mx-auto p-6 rounded-2xl border mt-10 space-y-3">
<h1 className="text-2xl font-bold">Agent Login</h1>
<input className="w-full border rounded-xl px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
<input className="w-full border rounded-xl px-3 py-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
<button disabled={loading} onClick={onLogin} className="w-full rounded-xl border px-3 py-2">{loading? 'Signing in...' : 'Login'}</button>
<p className="text-xs text-gray-500">Ask admin to register you first.</p>
</div>
)
}