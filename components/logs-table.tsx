'use client'
import { useEffect, useState } from 'react'
import CompanyPicker, { Company } from './company-picker'


export default function LogsTable(){
const [company, setCompany] = useState<Company>('connectiv')
const [rows, setRows] = useState<any[]>([])
useEffect(()=>{
fetch(`/api/logs?company=${company}`).then(r=>r.json()).then(setRows)
}, [company])
return (
<div className="space-y-3">
<div className="flex items-center gap-2">
<CompanyPicker value={company} onChange={setCompany} />
</div>
<div className="border rounded-2xl overflow-hidden">
<table className="w-full text-sm">
<thead className="bg-gray-50 dark:bg-gray-900">
<tr>
<th className="p-2 text-left">Time</th>
<th className="p-2 text-left">From</th>
<th className="p-2 text-left">To</th>
<th className="p-2 text-left">Dir</th>
<th className="p-2 text-left">Status</th>
<th className="p-2 text-left">Duration</th>
</tr>
</thead>
<tbody>
{rows.map(r=> (
<tr key={r.id} className="border-t">
<td className="p-2">{new Date(r.startedAt).toLocaleString()}</td>
<td className="p-2">{r.from}</td>
<td className="p-2">{r.to}</td>
<td className="p-2">{r.direction}</td>
<td className="p-2">{r.status}</td>
<td className="p-2">{r.duration ?? '-'}</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)
}