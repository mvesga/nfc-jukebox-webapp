import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Play, Music2 } from 'lucide-react'
import {
  fetchTags, createTag, updateTag, deleteTag, playByUid,
  type NFCTag,
} from '../api/client'
import { TagForm } from '../components/TagForm'

export function Tags() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<NFCTag | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  })

  const createMut = useMutation({
    mutationFn: createTag,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); setAdding(false) },
  })

  const updateMut = useMutation({
    mutationFn: ({ uid, patch }: { uid: string; patch: Partial<Omit<NFCTag, 'uid'>> }) =>
      updateTag(uid, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); setEditing(null) },
  })

  const deleteMut = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); setConfirmDelete(null) },
  })

  const playMut = useMutation({ mutationFn: playByUid })

  function handleSave(tag: NFCTag) {
    if (editing) {
      const { uid, ...patch } = tag
      updateMut.mutate({ uid, patch })
    } else {
      createMut.mutate(tag)
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending
  const saveError = (createMut.error ?? updateMut.error)?.message ?? null

  return (
    <div className="flex flex-col gap-6 py-8 px-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">NFC Tags</h1>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} /> Add Tag
        </button>
      </div>

      {isLoading && (
        <div className="text-slate-400 text-center animate-pulse py-8">Loading tags…</div>
      )}

      {!isLoading && tags.length === 0 && (
        <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
          <Music2 size={40} className="opacity-40" />
          <p>No tags registered yet.</p>
          <p className="text-sm">
            Scan a tag using <code className="bg-slate-700 px-1.5 rounded text-xs">python main.py --register</code> on
            the Pi, then add it here.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tags.map(tag => (
          <TagRow
            key={tag.uid}
            tag={tag}
            isPlaying={playMut.isPending && playMut.variables === tag.uid}
            onEdit={() => setEditing(tag)}
            onDelete={() => setConfirmDelete(tag.uid)}
            onPlay={() => playMut.mutate(tag.uid)}
          />
        ))}
      </div>

      {(adding || editing) && (
        <TagForm
          key={editing?.uid ?? 'new'}
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setAdding(false); setEditing(null); createMut.reset(); updateMut.reset() }}
          isSaving={isSaving}
          error={saveError}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete tag "${tags.find(t => t.uid === confirmDelete)?.name ?? confirmDelete}"?`}
          onConfirm={() => deleteMut.mutate(confirmDelete)}
          onCancel={() => { setConfirmDelete(null); deleteMut.reset() }}
          isLoading={deleteMut.isPending}
          error={deleteMut.error?.message ?? null}
        />
      )}
    </div>
  )
}

function TagRow({
  tag, isPlaying, onEdit, onDelete, onPlay,
}: {
  tag: NFCTag
  isPlaying: boolean
  onEdit: () => void
  onDelete: () => void
  onPlay: () => void
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{tag.name}</p>
        <p className="text-slate-400 text-xs truncate mt-0.5">{tag.spotify_uri}</p>
        <div className="flex gap-3 text-slate-500 text-xs mt-1">
          <span>{tag.device_name}</span>
          <span>Vol {tag.volume}</span>
          <span className="font-mono opacity-60">{tag.uid}</span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <IconBtn onClick={onPlay} disabled={isPlaying} title="Play now">
          <Play size={15} />
        </IconBtn>
        <IconBtn onClick={onEdit} title="Edit">
          <Pencil size={15} />
        </IconBtn>
        <IconBtn onClick={onDelete} title="Delete" danger>
          <Trash2 size={15} />
        </IconBtn>
      </div>
    </div>
  )
}

function IconBtn({
  onClick, disabled, title, danger, children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
        danger
          ? 'text-red-400 hover:bg-red-900/40'
          : 'text-slate-400 hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function ConfirmDialog({
  message, onConfirm, onCancel, isLoading, error,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
  error: string | null
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl flex flex-col gap-4">
        <p className="text-white">{message}</p>
        {error && (
          <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
