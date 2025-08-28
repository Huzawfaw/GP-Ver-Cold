'use client'
import { useEffect, useState } from 'react'


export default function AvailabilityToggle(){
const [available, setAvailable] = useState(false)
const [loading, setLoading] = useState(false)


useEffect(()=>{ /* optionally fetch current availability via /api/auth/me */ },[])


async function toggle(){
setLoading(true)
await fetch('/api/agents/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !available }) })
setAvailable(x=>!x)
setLoading(false)
}


return (
<button onClick={toggle} disabled={loading} className={`px-3 py-2 rounded-xl border ${available? 'bg-green-500/10' : ''}`}>
{available ? 'Available' : 'Busy'}
</button>
)
}