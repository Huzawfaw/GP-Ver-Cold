'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  extension: string;
  companies: string[];
};

type TwilioDevice = any; // keep it loose to avoid TS friction

export default function DialerClient({ extension, companies }: Props) {
  const [number, setNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'ready' | 'ringing' | 'live' | 'ended' | 'error'>('idle');
  const [company, setCompany] = useState(companies[0] ?? 'connectiv');
  const [loading, setLoading] = useState(false);

  const deviceRef = useRef<TwilioDevice | null>(null);
  const activeConnRef = useRef<any>(null);

  // Setup Twilio Device once
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        setLoading(true);
        // get a fresh token
        const res = await fetch(`/api/token?identity=${encodeURIComponent(extension)}&company=${encodeURIComponent(company)}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to get token');
        const { token } = await res.json();

        // dynamically import voice-sdk only in the browser
        const mod = await import('@twilio/voice-sdk');
        const Device = (mod as any).Device;

        const device: TwilioDevice = new Device(token, {
          codecPreferences: ['opus', 'pcmu'],
          enableRingingState: true,
        });

        device.on('ready', () => mounted && setStatus('ready'));
        device.on('error', (e: any) => {
          console.error('Twilio Device error', e);
          mounted && setStatus('error');
        });
        device.on('incoming', (conn: any) => {
          // auto-reject inbound for this simple dialer
          conn.reject();
        });

        deviceRef.current = device;
      } catch (e) {
        console.error(e);
        if (mounted) setStatus('error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    setup();
    return () => {
      mounted = false;
      try {
        deviceRef.current?.destroy();
      } catch {}
      deviceRef.current = null;
    };
  }, [extension, company]);

  
  const canCall =!!deviceRef.current && !loading && number.trim().length > 0 && status !== 'live' && status !== 'ringing';

  const startCall = async () => {
    if (!deviceRef.current) return;
    setStatus('ringing');
    try {
      const params = { To: number, company };
      const conn = deviceRef.current.connect({ params });
      activeConnRef.current = conn;

      conn.on('accept', () => setStatus('live'));
      conn.on('cancel', () => setStatus('ended'));
      conn.on('disconnect', () => setStatus('ended'));
      conn.on('error', () => setStatus('error'));
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const hangup = () => {
    try {
      activeConnRef.current?.disconnect();
      deviceRef.current?.disconnectAll?.();
    } catch {}
    setStatus('ended');
  };

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="border rounded-xl px-3 py-2 md:col-span-2"
          placeholder="Enter number (e.g., +15551234567)"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />

        <select
          className="border rounded-xl px-3 py-2"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        >
          {(companies.length ? companies : ['connectiv', 'booksnpayroll']).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={startCall}
          disabled={!canCall || loading}
          className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-40"
        >
          Call
        </button>

        <button
          onClick={hangup}
          className="rounded-xl border px-4 py-2"
        >
          Hang up
        </button>

        <span className="text-sm text-gray-500">
          Status:{' '}
          <b>
            {loading ? 'loading…' : status}
          </b>
        </span>
      </div>

      <p className="text-xs text-gray-500">
        Uses Twilio Voice SDK. Outbound caller ID / route is decided by your server’s TwiML based on the <code>company</code> param.
      </p>
    </div>
  );
}
