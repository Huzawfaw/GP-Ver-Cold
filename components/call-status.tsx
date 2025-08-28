export default function CallStatus({ status }: { status: string }) {
  return (
    <div className="p-4 rounded-2xl border">
      <h2 className="text-xl font-semibold">Call Status</h2>
      <p className="mt-2">{status}</p>
      <p className="text-sm text-gray-500 mt-2">
        Outbound: SDK → TwiML App → PSTN with per-company caller ID.
      </p>
    </div>
  );
}
