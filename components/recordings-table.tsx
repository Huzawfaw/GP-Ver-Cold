'use client'
import { useEffect, useState } from 'react'
import CompanyPicker, { Company } from './company-picker'


export default function RecordingsTable(){
const [company, setCompany] = useState<Company>('connectiv')
const [rows, setRows] = useState<any[]>([])
useEffect(()=>{ fetch(`/api/recordings?company=${company}`).then(r=>r.json()).then(setRows) }, [company])
return (
<div className="space-y-3">
<CompanyPicker value={company} onChange={setCompany} />
<div className="border rounded-2xl overflow-hidden">
<table className="w-full text-sm">
<thead className="bg-gray-50 dark:bg-gray-900">
<tr>
<th className="p-2 text-left">Time</th>
<th className="p-2 text-left">Call SID</th>
<th className="p-2 text-left">Duration</th>
<th className="p-2 text-left">Listen</th>
</tr>
</thead>
<tbody>
{rows.map(r=> (
<tr key={r.id} className="border-t">
<td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
<td className="p-2">{r.callSid}</td>
<td className="p-2">{r.duration ?? '-'}</td>
<td className="p-2"><audio controls src={`/api/recordings/play?sid=${r.recordingSid}`} /></td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)
}