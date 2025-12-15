export interface Anonymity {
  value: number
  label: string
}

export const ANONYMITY_LEVELS: Anonymity[] = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
]

export interface FilterProxies {
  countries?: string[]
  regions?: string[]
  city?: string
  speed?: number
  reliability?: number
  anons?: number[]
  protocs?: number[]
  last_check?: number
  accessible_websites?: string[]
  limit?: number
}

export interface Profile {
  id: string
  name: string
  owner_email: string
  filter: FilterProxies
  pac_url?: string
  active: boolean
  created_at: string
}

const API_BASE = '/api'

const getAuthHeader = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
})

export async function getProfiles(): Promise<Profile[]> {
  const response = await fetch(`${API_BASE}/profiles`, {
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch profiles')
  }

  return response.json()
}

export async function createProfile(
  name: string,
  filter: FilterProxies
): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profiles`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, filter }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create profile')
  }

  return response.json()
}

export async function updateProfile(
  profileId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profiles/${profileId}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update profile')
  }

  return response.json()
}

export async function deleteProfile(profileId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/profiles/${profileId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to delete profile')
  }
}

export async function generatePAC(profileId: string): Promise<string> {
  const response = await fetch(`${API_BASE}/profiles/${profileId}/pac`, {
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    throw new Error('Failed to generate PAC file')
  }

  return response.text()
}

export async function getMe(): Promise<{
  email: string
  admin: boolean
}> {
  const response = await fetch(`${API_BASE}/users/me`, {
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  return response.json()
}
