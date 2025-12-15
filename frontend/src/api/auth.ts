export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

const API_BASE = '/api'

/**
 * Login with email and password.
 * Expects a token in response or uses HTTP-only cookie session.
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const formData = new FormData()
  formData.append('username', email)
  formData.append('password', password)

  const response = await fetch(`${API_BASE}/token`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Login failed')
  }

  return response.json()
}
