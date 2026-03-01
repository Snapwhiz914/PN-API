const API_BASE = '/api';
export const getAuthHeader = () => ({
    Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
});
export async function getMe() {
    const response = await fetch(`${API_BASE}/users/me`, {
        headers: getAuthHeader(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch user info');
    }
    return response.json();
}
export async function getAllUsers() {
    const response = await fetch(`${API_BASE}/users/`, {
        headers: getAuthHeader(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    return response.json();
}
export async function createUser(email, password) {
    const response = await fetch(`${API_BASE}/users/`, {
        method: 'POST',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, plaintext_password: password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create user');
    }
}
export async function deleteUser(email) {
    const response = await fetch(`${API_BASE}/users/delete?email=${email}`, {
        method: 'POST',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete user');
    }
}
