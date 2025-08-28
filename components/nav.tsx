'use client'
import Link from 'next/link'
import ThemeToggle from './theme-toggle'
import AvailabilityToggle from './availability-toggle'


export default function Nav() {
async function logout(){
await fetch('/api/auth/logout', { method: 'POST' })
location.href = '/login'
}
return (
<nav className="border-b sticky top-0 bg-white/70 dark:bg-black/50 backdrop-blur z-50">
<div className="max-w-6xl mx-auto p-3 flex items-center justify-between">
<div className="flex items-center gap-4">
<Link href="/dialer" className="font-bold">Dialer</Link>
<Link href="/logs">Logs</Link>
<Link href="/recordings">Recordings</Link>
<Link href="/admin">Admin</Link>
</div>
<div className="flex items-center gap-3">
<AvailabilityToggle />
<ThemeToggle />
<button onClick={logout} className="px-3 py-2 rounded-xl border">Logout</button>
</div>
</div>
</nav>
)

}
