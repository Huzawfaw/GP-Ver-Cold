'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  extension: string;
  companies: string[];
};

type TwilioDevice = {
  connect: (opts: { params: Record<string, any> }) => any;
  disconnectAll?: () => void;
  destroy?: () => void;
  on: (event: string, cb: (...args: any[]) => void) => void;
};

export default function DialerClient({ extension, companies }: Props) {
  const [number, setNumber] = useState('');
  const [company, setCompany] = useState(companies[0] ?? 'connectiv');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'ready' | 'ringing' | 'live' | 'ended' | 'error'
  >('idle');
  const [errMsg, setErrMsg] = useState<string>('');

  const deviceRef = useRef<TwilioDevice | null>(null);
  const activeConnRef = useRef<any>(null);

  // --- Setup Twilio Device (or re-setup if company changes)
  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        setLoading(true);
        setErrMsg('');

        // get a fresh access token from our API
        const res = await fetch(
          `/api/token?identity=${encodeURIComponent(
            extension
          )}&company=${encodeURIComponent(company)}`,
          { cache: 'no-store' }
        );
        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(
            `Token error: ${res.status} ${res.statusText}${
              j?.error ? ` (${j.error})` : ''
            }`
          );
        }
        const { token } = await res.json();

        // import voice-sdk only in the browser
        const mod = await import('@twilio/voice-sdk');
        const Device = (mod as any).Device;

        // destroy old device, if any
        try {
          deviceRef.current?.destroy?.();
        } catch {}

        const device: TwilioDevice = new Device(token, {
          codecPreferences: ['opus', 'pcmu'],
          enableRingingState: true,
        });

        device.on('ready', () => {
          if (!mounted) return;
          setStatus('ready'); // allow calls
        });

        device.on('offline', () => {
          if (!mounted) return;
          // token expired / device offline – user can retry, we keep UI usable
          setStatus('ended');
        });

        device.on('error', (e: any) => {
          console.error('Twilio Device error', e);
          if (!mounted) return;
          setErrMsg(e?.message ?? 'Device error');
          // keep UI usable to allow retry
          setStatus('ended');
        });

        device.on('incoming', (conn: any) => {
          // simple dialer: reject inbound
          conn.reject();
        });

        deviceRef.current = device;
      } catch (e: any) {
        console.error(e);
        if (mounted) {
          setErrMsg(e?.message ?? 'Failed to initialize device');
          setStatus('error');
        }
      } finally {
        mounted && setLoading(false);
      }
    }

    setup();

    return () => {
      mounted = false;
      try {
        deviceRef.current?.destroy?.();
      } catch {}
      deviceRef.current = null;
      activeConnRef.current = null;
    };
  }, [extension, company]);

  // Enable Call button when device exists, not loading, have a number,
  // and we’re not already in a call.
  const canCall =
    !!deviceRef.current &&
    !loading &&
    number.trim().length > 0 &&
    status !== 'live' &&
    status !== 'ringing';

  const startCall = async () => {
    if (!deviceRef.current || !canCall) return;

    setStatus('ringing');
    setErrMsg('');

    try {
      const params = { To: number, company };
      const conn = deviceRef.current.connect({ params });
      activeConnRef.current = conn;

      conn.on('accept', () => setStatus('live'));

      // When a call ends or is canceled or errors out, return to READY so user can call again
      const backToReady = () => {
        activeConnRef.current = null;
        setStatus('ready');
      };
      conn.on('cancel', backToReady);
      conn.on('disconnect', backToReady);
      conn.on('error', (e: any) => {
        console.error('Call error', e);
        setErrMsg(e?.message ?? 'Call error');
        backToReady();
      });
    } catch (e: any) {
      console.error(e);
      setErrMsg(e?.message ?? 'Call failed');
      setStatus('ready');
    }
  };

  const hangup = () => {
    try {
      activeConnRef.current?.disconnect();
      deviceRef.current?.disconnectAll?.();
    } catch {}
    setStatus('ready'); // let them call again immediately
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
          {(companies.length ? companies : ['connectiv', 'booksnpayroll']).map(
            (c) => (
              <option key={c} value={c}>
                {c}
              </option>
            )
          )}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={startCall}
          disabled={!canCall}
          className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-40"
        >
          Call
        </button>

        <button onClick={hangup} className="rounded-xl border px-4 py-2">
          Hang up
        </button>

        <span className="text-sm text-gray-500">
          Status:{' '}
          <b>{loading ? 'loading…' : status}</b>
        </span>
      </div>

      {!!errMsg && (
        <div className="text-sm text-red-600">
          {errMsg}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Uses Twilio Voice SDK. Outbound caller ID / route is decided by your
        server’s TwiML based on the <code>company</code> param.
      </p>
    </div>
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
