import { jsx as _jsx } from "react/jsx-runtime";
import { MantineProvider } from '@mantine/core';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import { Home } from './pages/Home';
import { MapPage } from './pages/Map';
import { Users } from './pages/Users';
import { ScannerSettingsPage } from './pages/ScannerSettings';
import { Analytics } from './pages/Analytics';
import theme from './theme';
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('home');
    useEffect(() => {
        const validateToken = async () => {
            const token = sessionStorage.getItem('access_token');
            if (!token) {
                setIsLoggedIn(false);
                setIsLoading(false);
                return;
            }
            // Validate token by fetching /api/users/me
            try {
                const response = await fetch('/api/users/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.status === 401) {
                    // Token is invalid or expired
                    sessionStorage.removeItem('access_token');
                    setIsLoggedIn(false);
                }
                else if (response.ok) {
                    // Token is valid
                    setIsLoggedIn(true);
                }
                else {
                    // Other error, log out to be safe
                    sessionStorage.removeItem('access_token');
                    setIsLoggedIn(false);
                }
            }
            catch (err) {
                // Network error, keep logged in (assume offline)
                setIsLoggedIn(true);
            }
            finally {
                setIsLoading(false);
            }
        };
        validateToken();
    }, []);
    if (isLoading) {
        return null;
    }
    return (_jsx(MantineProvider, { theme: theme, defaultColorScheme: "dark", children: isLoggedIn ? (currentPage === 'home' ? (_jsx(Home, { onNavigateToMap: () => setCurrentPage('map'), onNavigateToUsers: () => setCurrentPage('users'), onNavigateToScannerSettings: () => setCurrentPage('scanner-settings'), onNavigateToAnalytics: () => setCurrentPage('analytics') })) : currentPage === 'map' ? (_jsx(MapPage, { onNavigateHome: () => setCurrentPage('home') })) : currentPage === 'users' ? (_jsx(Users, { onNavigateToHome: () => setCurrentPage('home') })) : currentPage === 'scanner-settings' ? (_jsx(ScannerSettingsPage, { onNavigateToHome: () => setCurrentPage('home') })) : (_jsx(Analytics, { onNavigateHome: () => setCurrentPage('home') }))) : (_jsx(Login, { onLoginSuccess: () => setIsLoggedIn(true) })) }));
}
export default App;
