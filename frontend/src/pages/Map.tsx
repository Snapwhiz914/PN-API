import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import {
  Box,
  Group,
  Stack,
  TextInput,
  Slider,
  MultiSelect,
  Button,
  Text,
  Paper,
  Loader,
  Badge,
  Flex,
  ActionIcon,
  Tooltip,
  Modal,
} from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import { getProxies, Proxy, ProxyFilters } from '../api/proxies'

// Marker icons for different speed ranges
const speedIcons = {
  red: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  violet: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  orange: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  gold: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  yellow: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  green: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  blue: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  grey: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  black: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
}

function getIconForSpeed(speed: number) {
  if (speed <= 1000) return speedIcons.red
  if (speed <= 2000) return speedIcons.violet
  if (speed <= 3000) return speedIcons.orange
  if (speed <= 4000) return speedIcons.gold
  if (speed <= 5000) return speedIcons.yellow
  if (speed <= 6000) return speedIcons.green
  if (speed <= 7000) return speedIcons.blue
  if (speed <= 8500) return speedIcons.grey
  return speedIcons.black
}

const PROTOCOL_OPTIONS = [
  { value: 'http', label: 'HTTP' },
  { value: 'https', label: 'HTTPS' },
  { value: 'socks4', label: 'SOCKS4' },
  { value: 'socks5', label: 'SOCKS5' },
]

const ANONYMITY_OPTIONS = [
  { value: '-1', label: 'Unknown' },
  { value: '0', label: 'None' },
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' },
]

// Convert slider position (0-100) to minutes using logarithmic scale
// Maps to approximately: 0->1min, 25->1hr, 50->4hr, 75->16hr, 100->1440min (24hr)
const sliderToMinutes = (sliderValue: number): number => {
  if (sliderValue === 0) return 1
  // Logarithmic scale: 10^(sliderValue/25) gives us exponential growth
  // sliderValue 0-100 maps to minutes 1-1440
  return Math.round(Math.pow(10, (sliderValue / 25)) - 1)
}

const minutesToSlider = (minutes: number): number => {
  if (minutes <= 1) return 0
  // Inverse: sliderValue = 25 * log10(minutes + 1)
  return Math.round(25 * Math.log10(minutes + 1))
}

interface MapPageProps {
  onNavigateHome?: () => void
}

interface FilterState {
  countries: string[]
  region: string
  city: string
  speed: number
  lastCheck: number
  protocols: string[]
  anonymity: string[]
}

interface Stats {
  totalProxies: number
  shownProxies: number
  protocolCounts: Record<string, number>
  anonymityCounts: Record<string, number>
  avgSpeed: number
}

// Track marker visibility separately since Leaflet markers don't have getOpacity
const markerVisibility = new Map<string, boolean>()

export function MapPage({ onNavigateHome }: MapPageProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markerClusterGroup = useRef<L.MarkerClusterGroup | null>(null)
  const markers = useRef<Map<string, L.Marker>>(new Map())
  const clusters = useRef<Map<number, L.MarkerClusterGroup>>(new Map())

  const [proxies, setProxies] = useState<Proxy[]>([])
  const [allCountries, setAllCountries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refetchCountdown, setRefetchCountdown] = useState(0)
  const [pauseRefresh, setPauseRefresh] = useState(false)
  const [lastCheckSlider, setLastCheckSlider] = useState(minutesToSlider(720))
  const [stats, setStats] = useState<Stats>({
    totalProxies: 0,
    shownProxies: 0,
    protocolCounts: {},
    anonymityCounts: {},
    avgSpeed: 0,
  })
  const [statsModalOpen, setStatsModalOpen] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    countries: [],
    region: '',
    city: '',
    speed: 5000,
    lastCheck: 720, // 12 hours in minutes
    protocols: [],
    anonymity: [],
  })

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    if (map.current) return // Prevent reinitializing

    map.current = L.map(mapContainer.current).setView([33.8182512, -84.3828412], 13)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map.current)

    // Initialize marker cluster group
    markerClusterGroup.current = L.markerClusterGroup({
      showCoverageOnHover: true,
      zoomToBoundsOnClick: false,
      iconCreateFunction: (cluster: any) => {
        const visibleCount = cluster
          .getAllChildMarkers()
          .filter((m: any) => markerVisibility.get((m as any)._leaflet_id) !== false)
          .length

        return L.divIcon({
          html: `<b>${visibleCount}</b>`,
          className: `rounded-cluster-icon ${visibleCount === 0 ? 'rci-transparent' : ''}`,
          iconSize: L.point(40, 40),
        })
      },
    })

    map.current.addLayer(markerClusterGroup.current)

    return () => {
      // Cleanup if needed
    }
  }, [])

  // Fetch proxies
  const fetchProxies = async () => {
    try {
      setLoading(true)
      setError('')

      const filterObj: ProxyFilters = {
        limit: 10000,
      }

      if (filters.countries.length > 0) {
        filterObj.countries = filters.countries
      }
      if (filters.region) {
        filterObj.regions = [filters.region]
      }
      if (filters.city) {
        filterObj.city = filters.city
      }
      if (filters.anonymity.length > 0) {
        filterObj.anons = filters.anonymity.map(Number)
      }

      const data = await getProxies(filterObj)
      setProxies(data)

      // Extract all unique countries
      const countries = Array.from(new Set(data.map((p) => p.location.country).filter(Boolean)))
      setAllCountries(countries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch proxies')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchProxies()
    // Set initial slider value from default lastCheck minutes
    setLastCheckSlider(minutesToSlider(720))
  }, [])

  // Auto-refetch timer
  useEffect(() => {
    if (refetchCountdown === 0 && !loading) {
      const timer = setTimeout(() => setRefetchCountdown(55), 5000)
      return () => clearTimeout(timer)
    }

    if (pauseRefresh) return

    const interval = setInterval(() => {
      setRefetchCountdown((prev) => {
        if (prev === 1) {
          fetchProxies()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [refetchCountdown, pauseRefresh, loading])

  // Update markers and map
  useEffect(() => {
    if (!map.current || !markerClusterGroup.current) return

    // Add/update markers
    proxies.forEach((proxy) => {
      const key = proxy.uri
      let marker = markers.current.get(key)

      if (marker) {
        // Update existing marker popup
        const popupContent = generatePopupContent(proxy)
        marker.setPopupContent(popupContent)
      } else {
        // Create new marker
        if (!proxy.location.lat || !proxy.location.lon) return

        const popupContent = generatePopupContent(proxy)
        marker = L.marker([proxy.location.lat, proxy.location.lon], {
          icon: getIconForSpeed(proxy.speed * 1000),
          title: proxy.uri,
        }).bindPopup(popupContent)

        markers.current.set(key, marker)

        // Check if marker should be clustered
        const lat = proxy.location.lat
        let existingCluster = clusters.current.get(lat)

        if (existingCluster) {
          existingCluster.addLayer(marker)
        } else {
          // Check if there's another marker at the same position
          let otherMarkerAtPos: L.Marker | undefined
          for (const [, m] of markers.current) {
            if (
              m !== marker &&
              m.getLatLng().lat === lat &&
              m.getLatLng().lng === proxy.location.lon
            ) {
              otherMarkerAtPos = m
              break
            }
          }

          if (otherMarkerAtPos) {
            // Create new cluster
            const newCluster = L.markerClusterGroup({
              showCoverageOnHover: true,
              zoomToBoundsOnClick: false,
              iconCreateFunction: (cluster: any) => {
                const visibleCount = cluster
                  .getAllChildMarkers()
                  .filter((m: any) => markerVisibility.get((m as any)._leaflet_id) !== false)
                  .length

                return L.divIcon({
                  html: `<b>${visibleCount}</b>`,
                  className: `rounded-cluster-icon ${visibleCount === 0 ? 'rci-transparent' : ''}`,
                  iconSize: L.point(40, 40),
                })
              },
            })

            markerClusterGroup.current!.removeLayer(otherMarkerAtPos)
            newCluster.addLayer(otherMarkerAtPos)
            newCluster.addLayer(marker)
            map.current!.addLayer(newCluster)
            clusters.current.set(lat, newCluster)
          } else {
            markerClusterGroup.current!.addLayer(marker)
          }
        }
      }
    })

    updateVisibility()
    updateStats()
  }, [proxies])

  const updateVisibility = () => {
    let shown = 0
    const lastCheckMs = filters.lastCheck * 60 * 1000

    for (const proxy of proxies) {
      let shouldShow = true

      // Country filter
      if (filters.countries.length > 0 && !filters.countries.includes(proxy.location.country)) {
        shouldShow = false
      }

      // Region filter
      if (filters.region && !proxy.location.region.includes(filters.region)) {
        shouldShow = false
      }

      // City filter
      if (filters.city && !proxy.location.city.includes(filters.city)) {
        shouldShow = false
      }

      // Protocol filter
      if (filters.protocols.length > 0) {
        const protocolStrs = filters.protocols
        if (!protocolStrs.includes(proxy.protoc)) {
          shouldShow = false
        }
      }

      // Anonymity filter
      if (filters.anonymity.length > 0) {
        const anonNums = filters.anonymity.map(Number)
        if (!anonNums.includes(proxy.anon)) {
          shouldShow = false
        }
      }

      // Speed filter
      if (proxy.speed * 1000 >= filters.speed) {
        shouldShow = false
      }

      // Last check filter
      const lastCheckDate = new Date(proxy.last_check)
      const timeSinceCheck = Date.now() - lastCheckDate.getTime()
      if (timeSinceCheck > lastCheckMs) {
        shouldShow = false
      }

      const marker = markers.current.get(proxy.uri)
      if (marker) {
        const leafletId = (marker as any)._leaflet_id
        markerVisibility.set(leafletId, shouldShow)
        marker.setOpacity(shouldShow ? 1 : 0.25)
        shown += shouldShow ? 1 : 0
      }
    }

    // Refresh clusters
    for (const cluster of clusters.current.values()) {
      cluster.refreshClusters()
    }

    if (markerClusterGroup.current) {
      markerClusterGroup.current.refreshClusters()
    }

    setStats((prev) => ({ ...prev, shownProxies: shown }))
  }

  const updateStats = () => {
    const protocolCounts: Record<string, number> = {
      'http': 0,
      'https': 0,
      'socks4': 0,
      'socks5': 0,
      'unknown': 0,
    }
    const anonymityCounts: Record<string, number> = { '-1': 0, '0': 0, '1': 0, '2': 0, '3': 0 }
    let totalSpeed = 0

    for (const proxy of proxies) {
      const protocolKey = proxy.protoc.toLowerCase()
      if (protocolKey in protocolCounts) {
        protocolCounts[protocolKey]++
      } else {
        protocolCounts['unknown']++
      }
      anonymityCounts[proxy.anon]++
      totalSpeed += proxy.speed * 1000
    }

    setStats((prev) => ({
      ...prev,
      totalProxies: proxies.length,
      protocolCounts,
      anonymityCounts,
      avgSpeed: proxies.length > 0 ? Math.round(totalSpeed / proxies.length) : 0,
    }))
  }

  const generatePopupContent = (proxy: Proxy): string => {
    const lastCheckDate = new Date(proxy.last_check)
    const now = new Date()
    const diffMs = now.getTime() - lastCheckDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
      .toString()
      .padStart(2, '0')
    const mins = (diffMins % 60).toString().padStart(2, '0')

    const anonLabels: Record<number, string> = {
      '-1': 'Unknown',
      '0': 'None',
      '1': 'Low',
      '2': 'Medium',
      '3': 'High',
    }

    return `
      <div style="font-size: 12px; white-space: nowrap;">
        <strong>${proxy.uri}</strong><br/>
        ${proxy.location.city}, ${proxy.location.region}, ${proxy.location.country}<br/>
        Anon: ${anonLabels[proxy.anon]}<br/>
        Speed: ${Math.round(proxy.speed * 1000)}ms<br/>
        Reliability: ${(proxy.reliability * 100).toFixed(1)}%<br/>
        Last Checked: (${hours}h ${mins}m)
      </div>
    `
  }

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Filter Bar */}
      <Paper p="md" style={{ flex: '0 0 auto', overflowY: 'visible', maxHeight: 'none' }}>
        <Stack gap="sm" style={{ overflowY: 'auto', maxHeight: '30vh' }}>
          <Group justify="space-between">
            <Text fw={500} size="lg">Proxy Map Filters</Text>
            {onNavigateHome && (
              <Button variant="subtle" size="xs" onClick={onNavigateHome}>
                Back to Profiles
              </Button>
            )}
          </Group>
          <Group grow>
            <MultiSelect
              label="Countries"
              placeholder="Select countries"
              data={allCountries.map((c) => ({ value: c, label: c }))}
              value={filters.countries}
              onChange={(value) => {
                handleFilterChange({ countries: value })
                setFilters((prev) => ({ ...prev, countries: value }))
                fetchProxies()
              }}
              searchable
              clearable
              styles={{ dropdown: { zIndex: 1000 } }}
            />

            <TextInput
              label="Region"
              placeholder="e.g., California"
              value={filters.region}
              onChange={(e) => {
                handleFilterChange({ region: e.currentTarget.value })
                updateVisibility()
              }}
            />

            <TextInput
              label="City"
              placeholder="e.g., New York"
              value={filters.city}
              onChange={(e) => {
                handleFilterChange({ city: e.currentTarget.value })
                updateVisibility()
              }}
            />
          </Group>

          <Group grow>
            <div>
              <Text size="sm" fw={500} mb={8}>
                Max Speed: {filters.speed}ms
              </Text>
              <Slider
                min={20}
                max={10000}
                step={100}
                value={filters.speed}
                onChange={(value) => {
                  handleFilterChange({ speed: value })
                  updateVisibility()
                }}
              />
            </div>

            <div>
              <Text size="sm" fw={500} mb={8}>
                Checked since: {Math.floor(sliderToMinutes(lastCheckSlider) / 60)}h {sliderToMinutes(lastCheckSlider) % 60}m
              </Text>
              <Slider
                min={0}
                max={100}
                step={1}
                value={lastCheckSlider}
                onChange={(value) => {
                  setLastCheckSlider(value)
                  const minutes = sliderToMinutes(value)
                  handleFilterChange({ lastCheck: minutes })
                  updateVisibility()
                }}
              />
            </div>
          </Group>

          <Group grow>
            <MultiSelect
              label="Protocols"
              placeholder="Select protocols"
              data={PROTOCOL_OPTIONS}
              value={filters.protocols}
              onChange={(value) => {
                handleFilterChange({ protocols: value })
                updateVisibility()
              }}
              searchable
              clearable
              styles={{ dropdown: { zIndex: 1000 } }}
            />

            <MultiSelect
              label="Anonymity"
              placeholder="Select anonymity levels"
              data={ANONYMITY_OPTIONS}
              value={filters.anonymity}
              onChange={(value) => {
                handleFilterChange({ anonymity: value })
                updateVisibility()
              }}
              searchable
              clearable
              styles={{ dropdown: { zIndex: 1000 } }}
            />

            <Flex gap="sm" align="flex-end">
              <Button
                onClick={() => {
                  setFilters({
                    countries: [],
                    region: '',
                    city: '',
                    speed: 5000,
                    lastCheck: 720,
                    protocols: [],
                    anonymity: [],
                  })
                  setLastCheckSlider(minutesToSlider(720))
                  fetchProxies()
                }}
              >
                Reset Filters
              </Button>
              <Tooltip label="Refresh proxies">
                <ActionIcon
                  onClick={fetchProxies}
                  loading={loading}
                  variant="default"
                  size="lg"
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            </Flex>
          </Group>
        </Stack>
      </Paper>

      {/* Map Container */}
      <Box
        ref={mapContainer}
        style={{
          flex: '1 1 auto',
          position: 'relative',
        }}
      />

      {/* Bottom Status Bar */}
      <Paper p="md" style={{ flex: '0 0 auto' }}>
        <Group justify="space-between">
          <Group>
            <div>
              <Text size="sm">
                Total proxies: {stats.totalProxies} | Shown: <Badge>{stats.shownProxies}</Badge>
              </Text>
            </div>
            {loading ? (
              <Loader size="sm" />
            ) : (
              <Text size="sm" c={error ? 'red' : 'green'}>
                {error || 'Fetch Success!'}
              </Text>
            )}
          </Group>

          <Group>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={pauseRefresh}
                  onChange={(e) => setPauseRefresh(e.currentTarget.checked)}
                />
                {' Pause Refresh'}
              </label>
            </div>
            <Text size="sm">
              {refetchCountdown > 0 ? `Next fetch: ${refetchCountdown}s` : 'Fetching...'}
            </Text>
            <Button size="xs" variant="subtle" onClick={() => setStatsModalOpen(true)}>
              Stats
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Stats Modal */}
      <Modal
        opened={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        title="Proxy Statistics"
        size="sm"
      >
        <Stack gap="md">
          <div>
            <Text fw={500} size="sm">
              Protocols:
            </Text>
            <Text size="sm">
              HTTP: {stats.protocolCounts['http']}, HTTPS: {stats.protocolCounts['https']}, SOCKS4:{' '}
              {stats.protocolCounts['socks4']}, SOCKS5: {stats.protocolCounts['socks5']}, Unknown:{' '}
              {stats.protocolCounts['unknown']}
            </Text>
          </div>
          <div>
            <Text fw={500} size="sm">
              Anonymity:
            </Text>
            <Text size="sm">
              Unknown: {stats.anonymityCounts['-1']}, None: {stats.anonymityCounts['0']}, Low:{' '}
              {stats.anonymityCounts['1']}, Medium: {stats.anonymityCounts['2']}, High:{' '}
              {stats.anonymityCounts['3']}
            </Text>
          </div>
          <div>
            <Text fw={500} size="sm">
              Average Speed: {stats.avgSpeed}ms
            </Text>
          </div>
        </Stack>
      </Modal>
    </Box>
  )
}
