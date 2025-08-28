'use client'
const COMPANIES = [
{ id: 'connectiv', label: 'Connectiv' },
{ id: 'booksnpayroll', label: 'BooksnPayroll' },
] as const


export type Company = typeof COMPANIES[number]['id']


export default function CompanyPicker({ value, onChange }:{ value: Company, onChange:(v:Company)=>void }){
return (
<select value={value} onChange={e=>onChange(e.target.value as Company)} className="border rounded-xl px-3 py-2">
{COMPANIES.map(c=> <option key={c.id} value={c.id}>{c.label}</option>)}
</select>
)
}