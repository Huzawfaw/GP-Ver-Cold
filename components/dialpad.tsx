'use client'
import { useEffect, useRef, useState } from 'react'
import * as Voice from '@twilio/voice-sdk'
import CompanyPicker, { Company } from './company-picker'
import CallStatus from './call-status'
import TransferModal from './transfer-modal'

export default function DialPad(){
  const [device, setDevice] = useState<Voice.Device | null>(null)
  const [status, setStatus] = useState('idle')
  const [number, setNumber] = useState('')
  const [company, setCompany] = useState<Company>('connectiv')
  const [identity, setIdentity] = useState<string>('')
  const [callSid, setCallSid] = useState<string>('')
  const [showTransfer, setShowTransfer] = useState(false)

  // Twilio SDK types don't export Connection cleanly in ESM; keep this as any.
  const connectionRef = useRef<any>(null)

  useEffect(()=>{
    async function init(){
      const tokRes = await fetch(`/api/token`)
      if(!tokRes.ok){ location.href = '/login'; return }
      const { token, identity: ext } = await tokRes.json()
      setIdentity(ext)

      const dev = new Voice.Device(token, { logLevel: 1 })
      dev.on('registered', ()=>setStatus('ready'))
      dev.on('error', e=>{ console.error(e); setStatus('error') })
      dev.on('incoming', (conn: any)=>{
        connectionRef.current = conn
        setCallSid(conn?.parameters?.CallSid || '')
        setStatus('incoming')
        conn.on('accept', ()=> setStatus('in-call'))
        conn.on('disconnect', ()=> { setStatus('idle'); setCallSid('') })
      })
      await dev.register()
      setDevice(dev)
      return () => { dev.unregister() }
    }
    init()
  }, [])

  async function call(){
    if(!device) return
    setStatus('dialing')
    const conn: any = await device.connect({ params: { To: number, company } })
    connectionRef.current = conn
    setCallSid(conn?.parameters?.CallSid || '')
    conn.on('accept', ()=> setStatus('in-call'))
    conn.on('disconnect', ()=> { setStatus('idle'); setCallSid('') })
  }

  function hangup(){ connectionRef.current?.disconnect() }
  function accept(){ connectionRef.current?.accept() }
  function reject(){ connectionRef.current?.reject() }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 p-4 rounded-2xl border">
        <h2 className="text-xl font-semibold">Dialer</h2>
        <div className="flex gap-2 items-center">
          <CompanyPicker value={company} onChange={setCompany} />
          <input className="border rounded-xl px-3 py-2 flex-1" placeholder="Enter number" value={number} onChange={e=>setNumber(e.target.value)} />
          <button onClick={call} className="px-3 py-2 rounded-xl border">Call</button>
          <button onClick={hangup} className="px-3 py-2 rounded-xl border">Hangup</button>
        </div>
        {status==='incoming' && (
          <div className="flex gap-2">
            <button onClick={accept} className="px-3 py-2 rounded-xl border">Accept</button>
            <button onClick={reject} className="px-3 py-2 rounded-xl border">Reject</button>
          </div>
        )}
        {status==='in-call' && (
          <div>
            <button onClick={()=>setShowTransfer(true)} className="px-3 py-2 rounded-xl border">Transfer</button>
          </div>
        )}
      </div>
      <CallStatus status={status} />

      {showTransfer && (
        <TransferModal company={company} selfExtension={identity} callSid={callSid} onClose={()=>setShowTransfer(false)} />
      )}
    </div>
  )
}
