import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { fetchDevices, type NFCTag } from '../api/client'

interface Props {
  initial?: NFCTag
  onSave: (tag: NFCTag) => void
  onClose: () => void
  isSaving: boolean
  error?: string | null
}

const emptyTag = (): NFCTag => ({ uid: '', name: '', spotify_uri: '', volume: 70, device_name: '' })

export function TagForm({ initial, onSave, onClose, isSaving, error }: Props) {
  const [form, setForm] = useState<NFCTag>(initial ?? emptyTag())
  const [uriError, setUriError] = useState('')

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: 30_000,
  })

  function set<K extends keyof NFCTag>(key: K, value: NFCTag[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function validateUri(uri: string): boolean {
    if (!uri.startsWith('spotify:')) {
      setUriError('Must start with spotify: — e.g. spotify:playlist:…')
      return false
    }
    setUriError('')
    return true
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateUri(form.spotify_uri)) return
    onSave(form)
  }

  const isNew = !initial

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-white font-semibold">{isNew ? 'Add NFC Tag' : 'Edit Tag'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <Field label="Tag UID" hint="e.g. 04:ab:cd:ef (scan with --register to find it)">
            <input
              required
              disabled={!isNew}
              value={form.uid}
              onChange={e => set('uid', e.target.value)}
              placeholder="04:ab:cd:ef"
              className="input"
            />
          </Field>

          <Field label="Label">
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Morning playlist"
              className="input"
            />
          </Field>

          <Field
            label="Spotify URI"
            hint={uriError || 'spotify:playlist:… or spotify:album:… or spotify:track:…'}
            hintError={!!uriError}
          >
            <input
              required
              value={form.spotify_uri}
              onChange={e => { set('spotify_uri', e.target.value); if (uriError) validateUri(e.target.value) }}
              onBlur={e => validateUri(e.target.value)}
              placeholder="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"
              className={`input ${uriError ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </Field>

          <Field label="Alexa Device">
            {devices.length > 0 ? (
              <select
                value={form.device_name}
                onChange={e => set('device_name', e.target.value)}
                className="input"
                required
              >
                <option value="">Select device…</option>
                {devices.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            ) : (
              <input
                required
                value={form.device_name}
                onChange={e => set('device_name', e.target.value)}
                placeholder="Living Room Echo"
                className="input"
              />
            )}
          </Field>

          <Field label={`Volume: ${form.volume}`}>
            <input
              type="range"
              min={0}
              max={100}
              value={form.volume}
              onChange={e => set('volume', Number(e.target.value))}
              className="w-full accent-green-500"
            />
          </Field>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold transition-colors"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, hintError, children }: { label: string; hint?: string; hintError?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {children}
      {hint && <p className={`text-xs ${hintError ? 'text-red-400' : 'text-slate-500'}`}>{hint}</p>}
    </div>
  )
}
