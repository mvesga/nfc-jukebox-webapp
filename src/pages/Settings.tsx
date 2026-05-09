import { useState } from 'react'
import axios from 'axios'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { getApiUrl, setApiUrl, type HealthResponse } from '../api/client'

type TestState = 'idle' | 'loading' | 'ok' | 'fail'

export function Settings() {
  const [url, setUrl] = useState(getApiUrl)
  const [saved, setSaved] = useState(false)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testResult, setTestResult] = useState<HealthResponse | null>(null)
  const [testError, setTestError] = useState<string>('')

  function handleSave() {
    const trimmed = url.replace(/\/$/, '')
    setApiUrl(trimmed)
    setUrl(trimmed)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleTest() {
    setTestState('loading')
    setTestResult(null)
    setTestError('')
    // Test the URL currently in the input, not necessarily the saved one.
    const base = url.replace(/\/$/, '')
    try {
      const { data } = await axios.get<HealthResponse>(`${base}/health`)
      setTestResult(data)
      setTestState('ok')
    } catch (err: unknown) {
      setTestState('fail')
      setTestError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-lg mx-auto w-full">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <section className="bg-slate-800 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-white font-semibold">Pi API URL</h2>
          <p className="text-slate-400 text-sm mt-1">
            The base URL of your Raspberry Pi's API. Saved in your browser's local storage.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setSaved(false) }}
            placeholder="http://raspberrypi.local:8000"
            className="input"
          />
          <p className="text-xs text-slate-500">
            Default: <code className="bg-slate-700 px-1 rounded">http://raspberrypi.local:8000</code> — or use the Pi's
            IP address if mDNS doesn't work on your network.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold transition-colors"
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
          <button
            onClick={handleTest}
            disabled={testState === 'loading'}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {testState === 'loading' ? (
              <><RefreshCw size={15} className="animate-spin" /> Testing…</>
            ) : 'Test connection'}
          </button>
        </div>

        {testState === 'ok' && testResult && (
          <div className="flex items-start gap-3 bg-green-900/30 border border-green-800 rounded-xl p-3">
            <CheckCircle size={18} className="text-green-400 mt-0.5 shrink-0" />
            <div className="text-sm text-green-300">
              <p className="font-medium">Connected</p>
              <p className="text-green-400 mt-0.5">
                Spotify: {testResult.authenticated ? 'authenticated' : 'not authenticated'} ·
                uptime {Math.floor(testResult.uptime_seconds / 60)}m {Math.floor(testResult.uptime_seconds % 60)}s
              </p>
            </div>
          </div>
        )}

        {testState === 'fail' && (
          <div className="flex items-start gap-3 bg-red-900/30 border border-red-800 rounded-xl p-3">
            <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div className="text-sm text-red-300">
              <p className="font-medium">Connection failed</p>
              <p className="text-red-400 mt-0.5 break-all">{testError}</p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-slate-800 rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-white font-semibold">Quick reference</h2>
        <dl className="text-sm flex flex-col gap-2">
          <Row label="Register a tag" value="python main.py --register" code />
          <Row label="View live logs" value="journalctl -u nfc-spotify -f" code />
          <Row label="Restart controller" value="sudo systemctl restart nfc-spotify" code />
          <Row label="Restart API" value="sudo systemctl restart nfc-spotify-api" code />
          <Row label="Re-authenticate Spotify" value="python setup_config.py --auth-only" code />
        </dl>
      </section>
    </div>
  )
}

function Row({ label, value, code }: { label: string; value: string; code?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-slate-400">{label}</dt>
      <dd>
        {code
          ? <code className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-200 block overflow-x-auto">{value}</code>
          : <span className="text-slate-200">{value}</span>
        }
      </dd>
    </div>
  )
}
