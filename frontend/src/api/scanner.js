import { getAuthHeader } from './user';
const API_BASE = '/api';
export async function getSettings() {
    const response = await fetch(`${API_BASE}/scanner/settings/`, {
        headers: getAuthHeader(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch scanner settings');
    }
    return response.json();
}
export async function updateSettings(settings) {
    const response = await fetch(`${API_BASE}/scanner/settings/`, {
        method: 'POST',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update scanner settings');
    }
}
export async function getStatistics() {
    const response = await fetch(`${API_BASE}/scanner/statistics/`, {
        headers: getAuthHeader(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch scanner statistics');
    }
    return response.json();
}
export async function getAvailableBlacklistFiles() {
    const response = await fetch(`${API_BASE}/scanner/settings/available_blacklist_files`, {
        headers: getAuthHeader(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch available blacklist files');
    }
    return response.json();
}
export async function getHistoricPings(filters) {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.uri) {
            params.append('uri', filters.uri);
        }
        if (filters.raw_headers_keyword) {
            params.append('raw_headers_keyword', filters.raw_headers_keyword);
        }
        if (filters.speed_min !== undefined) {
            params.append('speed_min', String(filters.speed_min));
        }
        if (filters.speed_max !== undefined) {
            params.append('speed_max', String(filters.speed_max));
        }
        if (filters.error_type) {
            params.append('error_type', filters.error_type);
        }
        if (filters.start_date) {
            params.append('start_date', filters.start_date);
        }
        if (filters.end_date) {
            params.append('end_date', filters.end_date);
        }
        if (filters.limit !== undefined) {
            params.append('limit', String(filters.limit));
        }
    }
    const query = params.toString();
    const url = query ? `${API_BASE}/scanner/historic_pings/?${query}` : `${API_BASE}/scanner/historic_pings/?limit=500`;
    const response = await fetch(url, {
        headers: getAuthHeader(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch historic pings');
    }
    return response.json();
}
