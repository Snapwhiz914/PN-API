import { MantineProvider } from '@mantine/core'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import { Home } from './pages/Home'
import { MapPage } from './pages/Map'
import { Users } from './pages/Users'
import { ScannerSettingsPage } from './pages/ScannerSettings'
import { Analytics } from './pages/Analytics'
import theme from './theme'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<'home' | 'map' | 'users' | 'scanner-settings' | 'analytics'>('home')

  useEffect(() => {
    const validateToken = async () => {
      const token = sessionStorage.getItem('access_token')
      
      if (!token) {
        setIsLoggedIn(false)
        setIsLoading(false)
        return
      }

      // Validate token by fetching /api/users/me
      try {
        const response = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          // Token is invalid or expired
          sessionStorage.removeItem('access_token')
          setIsLoggedIn(false)
        } else if (response.ok) {
          // Token is valid
          setIsLoggedIn(true)
        } else {
          // Other error, log out to be safe
          sessionStorage.removeItem('access_token')
          setIsLoggedIn(false)
        }
      } catch (err) {
        // Network error, keep logged in (assume offline)
        setIsLoggedIn(true)
      } finally {
        setIsLoading(false)
      }
    }

    validateToken()
  }, [])

  if (isLoading) {
    return null
  }

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      {isLoggedIn ? (
        currentPage === 'home' ? (
          <Home onNavigateToMap={() => setCurrentPage('map')} onNavigateToUsers={() => setCurrentPage('users')} onNavigateToScannerSettings={() => setCurrentPage('scanner-settings')} onNavigateToAnalytics={() => setCurrentPage('analytics')} />
        ) : currentPage === 'map' ? (
          <MapPage onNavigateHome={() => setCurrentPage('home')} />
        ) : currentPage === 'users' ? (
          <Users onNavigateToHome={() => setCurrentPage('home')} />
        ) : currentPage === 'scanner-settings' ? (
          <ScannerSettingsPage onNavigateToHome={() => setCurrentPage('home')} />
        ) : (
          <Analytics onNavigateHome={() => setCurrentPage('home')} />
        )
      ) : (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </MantineProvider>
  )
}

export default App
