import { useEffect, useState } from 'react'
import {
  Container,
  Stack,
  Title,
  Button,
  Group,
  Alert,
  Loader,
  Center,
  Card,
  Text,
  Grid,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Badge,
  Paper,
  SimpleGrid,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconAlertCircle, IconX } from '@tabler/icons-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { getProxies, Proxy } from '../api/proxies'
import { getHistoricPings, HistoricPing, HistoricPingsFilters } from '../api/scanner'

interface AnalyticsProps {
  onNavigateHome?: () => void
}

interface ChartDataPoint {
  timestamp: number
  time: string
  [key: string]: number | string // Dynamic keys for each URI
}

interface DataPoint {
  uri: string
  ping_time: string
  speed: number
  error_type: string
  raw_headers: string
}

export function Analytics({ onNavigateHome }: AnalyticsProps) {
  const [aliveProxies, setAliveProxies] = useState<Proxy[]>([])
  const [historicPings, setHistoricPings] = useState<HistoricPing[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Filter states
  const [filters, setFilters] = useState<HistoricPingsFilters>({
    limit: 500,
  })
  const [filteredUris, setFilteredUris] = useState<Set<string>>(new Set())

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        // Fetch alive proxies
        const proxies = await getProxies({ limit: 10000 })
        setAliveProxies(proxies)

        // Fetch historic pings
        const pings = await getHistoricPings(filters)
        setHistoricPings(pings)

        // Initialize with all URIs
        const uriSet = new Set(proxies.map((p) => p.uri))
        setFilteredUris(uriSet)
      } catch (err) {
        setError(`Failed to load analytics: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Process data and build chart whenever historic pings change
  useEffect(() => {
    const processChartData = () => {
      const dataMap = new Map<number, ChartDataPoint>()

      // Filter pings by selected URIs
      const filteredPings = historicPings.filter((ping) => filteredUris.has(ping.uri))

      // Group pings by timestamp and URI
      filteredPings.forEach((ping) => {
        const date = new Date(ping.ping_time)
        const timestamp = date.getTime()
        const key = `${ping.uri}`

        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, {
            timestamp,
            time: date.toLocaleTimeString(),
          })
        }

        const point = dataMap.get(timestamp)!
        // Use speed value, or 0 if there was an error
        point[key] = ping.error_type ? 0 : ping.speed
      })

      // Sort by timestamp
      const sorted = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp)
      setChartData(sorted)
    }

    processChartData()
  }, [historicPings, filteredUris])

  const handleApplyFilters = async () => {
    try {
      setLoading(true)
      const pings = await getHistoricPings(filters)
      setHistoricPings(pings)
    } catch (err) {
      setError(`Failed to apply filters: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = async () => {
    try {
      setLoading(true)
      setFilters({ limit: 500 })
      const pings = await getHistoricPings({ limit: 500 })
      setHistoricPings(pings)
    } catch (err) {
      setError(`Failed to clear filters: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleUri = (uri: string) => {
    const newUris = new Set(filteredUris)
    if (newUris.has(uri)) {
      newUris.delete(uri)
    } else {
      newUris.add(uri)
    }
    setFilteredUris(newUris)
  }

  const showPointDetails = (uri: string, speed: number) => {
    const ping = historicPings.find(
      (p) =>
        p.uri === uri &&
        (p.error_type ? 0 : p.speed) === speed &&
        filteredUris.has(p.uri)
    )

    if (ping) {
      setSelectedPoint({
        uri: ping.uri,
        ping_time: ping.ping_time,
        speed: ping.speed,
        error_type: ping.error_type,
        raw_headers: ping.raw_headers,
      })
      setModalOpen(true)
    }
  }

  const getUriColor = (index: number): string => {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    ]
    return colors[index % colors.length]
  }

  if (loading && !historicPings.length) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ minHeight: '400px' }}>
          <Loader />
        </Center>
      </Container>
    )
  }

  const visibleUris = Array.from(filteredUris).sort()

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Analytics Dashboard</Title>
        <Button variant="default" onClick={onNavigateHome}>
          Back to Home
        </Button>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle />} title="Error" color="red" mb="lg">
          {error}
        </Alert>
      )}

      <Stack gap="lg">
        {/* Chart Section */}
        <Card withBorder shadow="sm">
          <Card.Section withBorder inheritPadding py="md">
            <Title order={2}>Proxy Speed Over Time</Title>
          </Card.Section>
          <Card.Section inheritPadding pb="md">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Speed (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={0} stroke="#ff0000" strokeDasharray="5 5" />
                  {visibleUris.map((uri, index) => (
                    <Line
                      key={uri}
                      type="monotone"
                      dataKey={uri}
                      stroke={getUriColor(index)}
                      dot={{ r: 4, cursor: 'pointer', onClick: (e: any) => showPointDetails(uri, e.payload[uri]) }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Center style={{ minHeight: '400px' }}>
                <Text c="dimmed">No data available. Try adjusting filters or waiting for scan results.</Text>
              </Center>
            )}
          </Card.Section>
        </Card>

        {/* Filters Section */}
        <Card withBorder shadow="sm">
          <Card.Section withBorder inheritPadding py="md">
            <Title order={2}>Filters</Title>
          </Card.Section>
          <Card.Section inheritPadding pb="md">
            <Stack gap="md">
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <TextInput
                    label="Proxy URI"
                    placeholder="e.g., http://proxy.example.com:8080"
                    value={filters.uri || ''}
                    onChange={(e) => setFilters({ ...filters, uri: e.currentTarget.value || undefined })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <TextInput
                    label="Headers Keyword"
                    placeholder="Search in headers"
                    value={filters.raw_headers_keyword || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, raw_headers_keyword: e.currentTarget.value || undefined })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    label="Error Type"
                    placeholder="Select error type"
                    clearable
                    value={filters.error_type || null}
                    onChange={(value) => setFilters({ ...filters, error_type: value || undefined })}
                    data={Array.from(
                      new Set(historicPings.map((p) => p.error_type).filter((e) => e))
                    ).map((e) => ({ value: e, label: e }))}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <NumberInput
                    label="Speed Min (ms)"
                    placeholder="Minimum speed"
                    min={0}
                    value={filters.speed_min ?? ''}
                    onChange={(value) =>
                      setFilters({ ...filters, speed_min: typeof value === 'number' ? value : undefined })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <NumberInput
                    label="Speed Max (ms)"
                    placeholder="Maximum speed"
                    min={0}
                    value={filters.speed_max ?? ''}
                    onChange={(value) =>
                      setFilters({ ...filters, speed_max: typeof value === 'number' ? value : undefined })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <DateTimePicker
                    label="Start Date"
                    placeholder="Select start date"
                    value={filters.start_date ? new Date(filters.start_date) : null}
                    onChange={(value) =>
                      setFilters({ ...filters, start_date: value || undefined })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <DateTimePicker
                    label="End Date"
                    placeholder="Select end date"
                    value={filters.end_date ? new Date(filters.end_date) : null}
                    onChange={(value) =>
                      setFilters({ ...filters, end_date: value || undefined })
                    }
                  />
                </Grid.Col>
              </Grid>

              <Group justify="flex-end">
                <Button variant="default" onClick={handleClearFilters} leftSection={<IconX size={16} />}>
                  Clear Filters
                </Button>
                <Button onClick={handleApplyFilters} loading={loading}>
                  Apply Filters
                </Button>
              </Group>
            </Stack>
          </Card.Section>
        </Card>

        {/* URI Selection Section */}
        <Card withBorder shadow="sm">
          <Card.Section withBorder inheritPadding py="md">
            <Group justify="space-between">
              <Title order={2}>Proxies ({visibleUris.length})</Title>
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => setFilteredUris(new Set(aliveProxies.map((p) => p.uri)))}
                >
                  Show All
                </Button>
                <Button size="xs" variant="subtle" onClick={() => setFilteredUris(new Set())}>
                  Hide All
                </Button>
              </Group>
            </Group>
          </Card.Section>
          <Card.Section inheritPadding pb="md">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="xs">
              {aliveProxies.map((proxy, index) => (
                <Paper
                  key={proxy.uri}
                  p="sm"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    backgroundColor: filteredUris.has(proxy.uri) ? 'rgba(0, 120, 215, 0.1)' : 'transparent',
                    borderColor: filteredUris.has(proxy.uri) ? getUriColor(index) : 'var(--mantine-color-gray-4)',
                    borderWidth: filteredUris.has(proxy.uri) ? 2 : 1,
                  }}
                  onClick={() => toggleUri(proxy.uri)}
                >
                  <Stack gap={4}>
                    <Text size="xs" fw={500} truncate title={proxy.uri}>
                      {proxy.uri}
                    </Text>
                    <Group gap={4}>
                      <Badge size="xs" variant="light">
                        {proxy.protoc}
                      </Badge>
                      <Badge size="xs" variant="light">
                        {proxy.speed}ms
                      </Badge>
                    </Group>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Card.Section>
        </Card>
      </Stack>

      {/* Details Modal */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Ping Details" size="lg">
        {selectedPoint && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed">
                Proxy URI
              </Text>
              <Text fw={500} style={{ wordBreak: 'break-word' }}>
                {selectedPoint.uri}
              </Text>
            </div>

            <div>
              <Text size="sm" c="dimmed">
                Timestamp
              </Text>
              <Text fw={500}>{new Date(selectedPoint.ping_time).toLocaleString()}</Text>
            </div>

            {selectedPoint.error_type ? (
              <div>
                <Text size="sm" c="dimmed">
                  Error
                </Text>
                <Badge color="red">{selectedPoint.error_type}</Badge>
              </div>
            ) : (
              <>
                <div>
                  <Text size="sm" c="dimmed">
                    Speed
                  </Text>
                  <Text fw={500}>{selectedPoint.speed} ms</Text>
                </div>

                <div>
                  <Text size="sm" c="dimmed">
                    Raw Headers
                  </Text>
                  <Paper p="xs" bg="dark" style={{ overflow: 'auto', maxHeight: '300px' }}>
                    <Text size="xs" fw={400} style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {selectedPoint.raw_headers}
                    </Text>
                  </Paper>
                </div>
              </>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  )
}
