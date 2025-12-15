import { User, getAuthHeader } from '../api/user'

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
  owner: User
  proxies: FilterProxies
  pac_url?: string
  active: boolean
}

const API_BASE = '/api'

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
    body: JSON.stringify({ name: name, proxy_filter: filter }),
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
  const response = await fetch(`${API_BASE}/profiles/${profileId}/change_filter`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ new_filter: updates.proxies }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update profile')
  }

  // Fetch and return the updated profile
  const allProfiles = await getProfiles()
  const updatedProfile = allProfiles.find((p) => p.id === profileId)
  if (!updatedProfile) {
    throw new Error('Profile not found after update')
  }
  return updatedProfile
}

export async function deleteProfile(profileId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/profiles/${profileId}/delete`, {
    method: 'POST',
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

export async function activateProfile(profileId: string): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profiles/${profileId}/activate`, {
    method: 'POST',
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to activate profile')
  }

  // Fetch and return the updated profile
  const allProfiles = await getProfiles()
  const updatedProfile = allProfiles.find((p) => p.id === profileId)
  if (!updatedProfile) {
    throw new Error('Profile not found after activation')
  }
  return updatedProfile
}

export async function deactivateProfile(profileId: string): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profiles/${profileId}/deactivate`, {
    method: 'POST',
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to deactivate profile')
  }

  // Fetch and return the updated profile
  const allProfiles = await getProfiles()
  const updatedProfile = allProfiles.find((p) => p.id === profileId)
  if (!updatedProfile) {
    throw new Error('Profile not found after deactivation')
  }
  return updatedProfile
}
