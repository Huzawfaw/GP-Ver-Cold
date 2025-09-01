// app/(protected)/dialer/page.tsx
export const dynamic = 'force-dynamic';

import { requireUser } from '@/lib/session';
import DialerClient from './DialerClient';

export default async function DialerPage() {
  const user = await requireUser(); // redirects to /login if missing/invalid cookie

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dialer</h1>
        <div className="text-xs text-gray-500">
          {user.email} • ext {user.extension} {user.isAdmin ? '• admin' : ''}
        </div>
      </div>

      <DialerClient
        extension={user.extension}
        companies={Array.isArray(user.companies) ? user.companies : []}
      />
    </div>
  );
}
