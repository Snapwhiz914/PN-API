const API_BASE = '/api';
/**
 * Login with email and password.
 * Expects a token in response or uses HTTP-only cookie session.
 */
export async function login(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }
    return response.json();
}
