import { getAuthHeader } from './user'

export interface WebsiteConfig {
  url: string
  timeout_seconds: number
  mark_dead_on_fail: boolean
}

export interface ScannerSettings {
  id?: string
  num_scan_threads: number
  alive_check_interval_minutes: number
  dead_check_interval_minutes: number
  scan_check_timeout_seconds: number
  blacklist_files: string[]
  websites: WebsiteConfig[]
}

export interface ScanningStatistics {
  check_queue_size: number
  non_blacklisted_ips: number
  blacklisted_ips: number
}

const API_BASE = '/api'

export async function getSettings(): Promise<ScannerSettings> {
  const response = await fetch(`${API_BASE}/scanner/settings/`, {
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch scanner settings')
  }

  return response.json()
}

export async function updateSettings(settings: Partial<ScannerSettings>): Promise<void> {
  const response = await fetch(`${API_BASE}/scanner/settings/`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update scanner settings')
  }
}

export async function getStatistics(): Promise<ScanningStatistics> {
  const response = await fetch(`${API_BASE}/scanner/statistics/`, {
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch scanner statistics')
  }

  return response.json()
}

export async function getAvailableBlacklistFiles(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/scanner/settings/available_blacklist_files`, {
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch available blacklist files')
  }

  return response.json()
}

export interface HistoricPing {
  id?: string
  uri: string
  raw_headers: string
  speed: number
  error_type: string
  ping_time: string
}

export interface HistoricPingsFilters {
  uri?: string
  raw_headers_keyword?: string
  speed_min?: number
  speed_max?: number
  error_type?: string
  start_date?: string
  end_date?: string
  limit?: number
}

export async function getHistoricPings(filters?: HistoricPingsFilters): Promise<HistoricPing[]> {
  const params = new URLSearchParams()

  if (filters) {
    if (filters.uri) {
      params.append('uri', filters.uri)
    }
    if (filters.raw_headers_keyword) {
      params.append('raw_headers_keyword', filters.raw_headers_keyword)
    }
    if (filters.speed_min !== undefined) {
      params.append('speed_min', String(filters.speed_min))
    }
    if (filters.speed_max !== undefined) {
      params.append('speed_max', String(filters.speed_max))
    }
    if (filters.error_type) {
      params.append('error_type', filters.error_type)
    }
    if (filters.start_date) {
      params.append('start_date', filters.start_date)
    }
    if (filters.end_date) {
      params.append('end_date', filters.end_date)
    }
    if (filters.limit !== undefined) {
      params.append('limit', String(filters.limit))
    }
  }

  const query = params.toString()
  const url = query ? `${API_BASE}/scanner/historic_pings/?${query}` : `${API_BASE}/scanner/historic_pings/?limit=500`

  const response = await fetch(url, {
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch historic pings')
  }

  return response.json()
}
