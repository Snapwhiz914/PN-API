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

export async function getAllUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE}/users/`, {
    headers: getAuthHeader(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}

export async function createUser(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE}/users/`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, plaintext_password: password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create user')
  }
}

export async function deleteUser(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/users/delete?email=${email}`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to delete user')
  }
}