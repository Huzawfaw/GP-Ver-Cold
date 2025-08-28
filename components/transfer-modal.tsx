'use client'
import { useEffect, useState } from 'react'
import type { Company } from './company-picker'


export default function TransferModal({ company, callSid, selfExtension, onClose }:{ company: Company, callSid: string, selfExtension: string, onClose: ()=>void }){
const [agents, setAgents] = useState<any[]>([])
const [target, setTarget] = useState('')
const [busy, setBusy] = useState(false)


useEffect(()=>{
fetch(`/api/agents/list?company=${company}`).then(r=>r.json()).then(rows=>{
setAgents(rows.filter((a:any)=> a.extension !== selfExtension))
})
}, [company, selfExtension])


async function doTransfer(){
setBusy(true)
await fetch('/api/voice/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callSid, targetExtension: target }) })
setBusy(false)
onClose()
}


return (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
<div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 w-full max-w-md space-y-3">
<h3 className="text-lg font-semibold">Transfer Call</h3>
<select className="w-full border rounded-xl px-3 py-2" value={target} onChange={e=>setTarget(e.target.value)}>
<option value="">Select agent</option>
{agents.map((a:any)=> <option key={a.extension} value={a.extension}>{a.name} ({a.extension}) {a.available? '•' : ''}</option>)}
</select>
<div className="flex gap-2 justify-end">
<button onClick={onClose} className="px-3 py-2 rounded-xl border">Cancel</button>
<button disabled={!target || busy} onClick={doTransfer} className="px-3 py-2 rounded-xl border">Transfer</button>
</div>
</div>
</div>
)
}