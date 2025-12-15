import { getAuthHeader } from './user'

export interface Location {
  lat: number | null
  lon: number | null
  city: string
  region: string
  country: string
}

export interface Proxy {
  uri: string
  speed: number
  last_check: string
  anon: number
  protoc: string
  reliability: number
  location: Location
}

export interface ProxyFilters {
  countries?: string[]
  regions?: string[]
  city?: string
  speed?: number
  anons?: number[]
  last_check?: number
  limit?: number
}

const API_BASE = '/api'

function extractProtocolFromUri(uri: string): string {
  const match = uri.match(/^([a-z0-9]+):\/\//)
  return match ? match[1].toLowerCase() : 'unknown'
}

export async function getProxies(filters?: ProxyFilters): Promise<Proxy[]> {
  const params = new URLSearchParams()

  if (filters) {
    if (filters.countries?.length) {
      filters.countries.forEach((c) => params.append('countries', c))
    }
    if (filters.regions?.length) {
      filters.regions.forEach((r) => params.append('regions', r))
    }
    if (filters.city) {
      params.append('city', filters.city)
    }
    if (filters.speed !== undefined) {
      params.append('speed', String(filters.speed))
    }
    if (filters.anons?.length) {
      filters.anons.forEach((a) => params.append('anons', String(a)))
    }
    if (filters.last_check !== undefined) {
      params.append('last_check', String(filters.last_check))
    }
    if (filters.limit) {
      params.append('limit', String(filters.limit))
    }
  }

  const query = params.toString()
  const url = query ? `${API_BASE}/proxies?${query}` : `${API_BASE}/proxies?limit=10000`

  const response = await fetch(url, {
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch proxies')
  }

  const rawProxies = await response.json()
  
  // Add protoc field extracted from URI
  return rawProxies.map((proxy: any) => ({
    ...proxy,
    protoc: extractProtocolFromUri(proxy.uri),
  }))
}
