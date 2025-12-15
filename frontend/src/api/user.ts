export interface User {
  id: string
  email: string
  password: string
  admin: boolean
}

const API_BASE = '/api'

export const getAuthHeader = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
})

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