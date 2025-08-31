export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Agent Login</h1>
      <form method="POST" action="/api/auth/login" className="space-y-3">
        <input name="email" type="email" placeholder="Email" className="w-full border rounded-xl px-3 py-2" required />
        <input name="password" type="password" placeholder="Password" className="w-full border rounded-xl px-3 py-2" required />
        <button type="submit" className="w-full rounded-xl border px-3 py-2">Sign in</button>
      </form>
      <p className="text-xs text-gray-500">Ask admin to register you first.</p>
    </div>
  )
}
