import LogsTable from '@/components/logs-table'
export default function Page(){
return (
<div className="space-y-4">
<h1 className="text-2xl font-bold">Call Logs</h1>
<LogsTable />
</div>
)
}