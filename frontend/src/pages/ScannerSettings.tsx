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
  TextInput,
  NumberInput,
  Switch,
  Card,
  Text,
  Tabs,
  Badge,
  Anchor,
} from '@mantine/core'
import { getSettings, updateSettings, getStatistics, getAvailableBlacklistFiles, ScannerSettings, ScanningStatistics, WebsiteConfig } from '../api/scanner'

interface ScannerSettingsPageProps {
  onNavigateToHome?: () => void
}

export function ScannerSettingsPage({ onNavigateToHome }: ScannerSettingsPageProps) {
  const [settings, setSettings] = useState<ScannerSettings | null>(null)
  const [stats, setStats] = useState<ScanningStatistics | null>(null)
  const [availableBlacklistFiles, setAvailableBlacklistFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Fetch settings, stats, and available blacklist files on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        const [settingsData, statsData, blacklistFilesData] = await Promise.all([
          getSettings(),
          getStatistics(),
          getAvailableBlacklistFiles(),
        ])

        setSettings(settingsData)
        setStats(statsData)
        setAvailableBlacklistFiles(blacklistFilesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scanner settings')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSettingsChange = (key: string, value: any) => {
    if (settings) {
      setSettings({
        ...settings,
        [key]: value,
      })
    }
  }

  const handleWebsiteChange = (index: number, field: keyof WebsiteConfig, value: any) => {
    if (settings && settings.websites) {
      const newWebsites = [...settings.websites]
      newWebsites[index] = {
        ...newWebsites[index],
        [field]: value,
      }
      setSettings({
        ...settings,
        websites: newWebsites,
      })
    }
  }

  const handleAddWebsite = () => {
    if (settings && settings.websites) {
      setSettings({
        ...settings,
        websites: [
          ...settings.websites,
          { url: '', timeout_seconds: 10, mark_dead_on_fail: true },
        ],
      })
    }
  }

  const handleRemoveWebsite = (index: number) => {
    if (settings && settings.websites) {
      setSettings({
        ...settings,
        websites: settings.websites.filter((_, i) => i !== index),
      })
    }
  }

  const handleToggleBlacklistFile = (filename: string) => {
    if (settings) {
      const newFiles = settings.blacklist_files.includes(filename)
        ? settings.blacklist_files.filter((f) => f !== filename)
        : [...settings.blacklist_files, filename]
      setSettings({
        ...settings,
        blacklist_files: newFiles,
      })
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')

      if (!settings) return

      await updateSettings(settings)
      setSuccessMessage('Scanner settings updated successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Center>
          <Loader />
        </Center>
      </Container>
    )
  }

  if (!settings) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" title="Error">
          Failed to load scanner settings
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title>Scanner Settings</Title>
          <Group>
            <Button onClick={handleSaveSettings} loading={saving}>
              Save Settings
            </Button>
            {onNavigateToHome && (
              <Button variant="light" onClick={onNavigateToHome}>
                Back to Home
              </Button>
            )}
          </Group>
        </Group>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert color="green" title="Success">
            {successMessage}
          </Alert>
        )}

        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab value="general">General Settings</Tabs.Tab>
            <Tabs.Tab value="websites">Websites</Tabs.Tab>
            <Tabs.Tab value="blacklist">Blacklist</Tabs.Tab>
            <Tabs.Tab value="statistics">Statistics</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="md">
            <Card withBorder padding="lg" radius="md">
              <Stack gap="md">
                <NumberInput
                  label="Number of Scan Threads"
                  description="Number of concurrent threads for proxy scanning. Modifying this value while the scanner is running will kill all current scan threads and restart the specified number"
                  value={settings.num_scan_threads}
                  onChange={(val) => handleSettingsChange('num_scan_threads', val)}
                  min={1}
                  max={1000}
                />

                <NumberInput
                  label="Alive Check Interval (minutes)"
                  description="How often to re-check alive proxies"
                  value={settings.alive_check_interval_minutes}
                  onChange={(val) => handleSettingsChange('alive_check_interval_minutes', val)}
                  min={1}
                />

                <NumberInput
                  label="Dead Check Interval (minutes)"
                  description="How often to re-check dead proxies"
                  value={settings.dead_check_interval_minutes}
                  onChange={(val) => handleSettingsChange('dead_check_interval_minutes', val)}
                  min={1}
                />

                <NumberInput
                  label="Scan Check Timeout (seconds)"
                  description="Timeout for each proxy validation request"
                  value={settings.scan_check_timeout_seconds}
                  onChange={(val) => handleSettingsChange('scan_check_timeout_seconds', val)}
                  min={1}
                  max={30}
                />
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="websites" pt="md">
            <Card withBorder padding="lg" radius="md">
              <Stack gap="md">
                {settings.websites.map((website, index) => (
                  <Card key={index} withBorder padding="md" radius="sm" bg="gray.9">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Text fw={500}>Website {index + 1}</Text>
                        {settings.websites.length > 1 && (
                          <Button
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={() => handleRemoveWebsite(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </Group>

                      <TextInput
                        label="URL"
                        placeholder="https://example.com"
                        value={website.url}
                        onChange={(e) => handleWebsiteChange(index, 'url', e.currentTarget.value)}
                      />

                      <NumberInput
                        label="Timeout (seconds)"
                        value={website.timeout_seconds}
                        onChange={(val) => handleWebsiteChange(index, 'timeout_seconds', val)}
                        min={1}
                        max={60}
                      />

                      <Switch
                        label="Mark as dead on failure"
                        checked={website.mark_dead_on_fail}
                        onChange={(e) => handleWebsiteChange(index, 'mark_dead_on_fail', e.currentTarget.checked)}
                      />
                    </Stack>
                  </Card>
                ))}

                <Button onClick={handleAddWebsite} variant="light">
                  Add Website
                </Button>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="blacklist" pt="md">
            <Card withBorder padding="lg" radius="md">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="sm" c="dimmed">
                      Select which blacklist files to use for filtering proxies
                    </Text>
                    <Anchor href="https://github.com/firehol/blocklist-ipsets" target="_blank" size="sm" mt="xs">
                      View blocklist-ipsets on GitHub →
                    </Anchor>
                  </div>
                </Group>

                <Stack gap="xs">
                  {availableBlacklistFiles.length > 0 ? (
                    availableBlacklistFiles.map((filename) => (
                      <Switch
                        key={filename}
                        label={filename}
                        checked={settings.blacklist_files.includes(filename)}
                        onChange={() => handleToggleBlacklistFile(filename)}
                      />
                    ))
                  ) : (
                    <Text size="sm" c="dimmed">
                      No blacklist files found
                    </Text>
                  )}
                </Stack>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="statistics" pt="md">
            {stats ? (
              <Card withBorder padding="lg" radius="md">
                <Stack gap="md">
                  <Group justify="space-around">
                    <div>
                      <Text size="sm" c="dimmed">
                        Check Queue Size
                      </Text>
                      <Badge size="lg" variant="light">
                        {stats.check_queue_size}
                      </Badge>
                    </div>

                    <div>
                      <Text size="sm" c="dimmed">
                        Non-Blacklisted IPs
                      </Text>
                      <Badge size="lg" variant="light" color="green">
                        {stats.non_blacklisted_ips}
                      </Badge>
                    </div>

                    <div>
                      <Text size="sm" c="dimmed">
                        Blacklisted IPs
                      </Text>
                      <Badge size="lg" variant="light" color="red">
                        {stats.blacklisted_ips}
                      </Badge>
                    </div>
                  </Group>
                </Stack>
              </Card>
            ) : (
              <Loader />
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}
