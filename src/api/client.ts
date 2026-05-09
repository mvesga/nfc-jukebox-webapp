import axios from 'axios'

const DEFAULT_API_URL = import.meta.env.VITE_API_URL ?? 'http://raspberrypi.local:8000'

export function getApiUrl(): string {
  return localStorage.getItem('nfc_api_url') ?? DEFAULT_API_URL
}

export function setApiUrl(url: string): void {
  localStorage.setItem('nfc_api_url', url)
}

export const api = axios.create({ baseURL: getApiUrl() })

// Re-read the base URL on every request so changes in Settings take effect without reload.
api.interceptors.request.use((config) => {
  config.baseURL = getApiUrl()
  return config
})

// ---------- Types ----------

export interface NFCTag {
  uid: string
  name: string
  spotify_uri: string
  volume: number
  device_name: string
}

export interface Device {
  id: string
  name: string
  type: string
  is_active: boolean
}

export interface PlaybackState {
  device?: { name: string; volume_percent: number }
  item?: { name: string; artists: { name: string }[]; album: { name: string; images: { url: string }[] } }
  is_playing: boolean
  progress_ms: number
  duration_ms: number
}

export interface HealthResponse {
  status: string
  uptime_seconds: number
  authenticated: boolean
}

// ---------- API calls ----------

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/health')
  return data
}

export async function fetchTags(): Promise<NFCTag[]> {
  const { data } = await api.get<{ tags: NFCTag[] }>('/tags')
  return data.tags
}

export async function createTag(tag: NFCTag): Promise<NFCTag> {
  const { data } = await api.post<{ tag: NFCTag }>('/tags', tag)
  return data.tag
}

export async function updateTag(uid: string, patch: Partial<Omit<NFCTag, 'uid'>>): Promise<NFCTag> {
  const { data } = await api.put<{ tag: NFCTag }>(`/tags/${encodeURIComponent(uid)}`, patch)
  return data.tag
}

export async function deleteTag(uid: string): Promise<void> {
  await api.delete(`/tags/${encodeURIComponent(uid)}`)
}

export async function fetchDevices(): Promise<Device[]> {
  const { data } = await api.get<{ devices: Device[] }>('/devices')
  return data.devices
}

export async function fetchPlayback(): Promise<PlaybackState | null> {
  const { data } = await api.get<{ playback: PlaybackState | null }>('/status')
  return data.playback
}

export async function playByUid(uid: string): Promise<void> {
  await api.post('/play', { uid })
}

export async function playByUri(uri: string, device_name: string, volume?: number): Promise<void> {
  await api.post('/play', { uri, device_name, volume })
}

export async function pausePlayback(): Promise<void> {
  await api.post('/pause')
}

export async function resumePlayback(): Promise<void> {
  await api.post('/resume')
}
