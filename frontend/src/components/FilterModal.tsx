import { useState } from 'react'
import {
  Modal,
  Button,
  Stack,
  Group,
  TextInput,
  NumberInput,
  MultiSelect,
} from '@mantine/core'
import { FilterProxies, ANONYMITY_LEVELS } from '../api/profiles'

interface FilterModalProps {
  opened: boolean
  onClose: () => void
  onApply: (filter: FilterProxies) => void
  initialFilter?: FilterProxies
}

const PROTOCOL_OPTIONS = [
  { value: '0', label: 'HTTP' },
  { value: '1', label: 'HTTPS' },
  { value: '2', label: 'SOCKS4' },
  { value: '3', label: 'SOCKS5' },
]

export function FilterModal({
  opened,
  onClose,
  onApply,
  initialFilter,
}: FilterModalProps) {
  const [countries, setCountries] = useState<string>(initialFilter?.countries?.join(', ') || '')
  const [regions, setRegions] = useState<string>(initialFilter?.regions?.join(', ') || '')
  const [city, setCity] = useState(initialFilter?.city || '')
  const [speed, setSpeed] = useState<number | string>(initialFilter?.speed || '')
  const [reliability, setReliability] = useState<number | string>(
    initialFilter?.reliability || ''
  )
  const [anons, setAnons] = useState<string[]>(
    (initialFilter?.anons?.map(String) || [])
  )
  const [protocs, setProtocs] = useState<string[]>(
    (initialFilter?.protocs?.map(String) || [])
  )
  const [lastCheck, setLastCheck] = useState<number | string>(
    initialFilter?.last_check || ''
  )
  const [websites, setWebsites] = useState<string>(
    initialFilter?.accessible_websites?.join(', ') || ''
  )
  const [limit, setLimit] = useState<number | string>(initialFilter?.limit || 20)

  const handleApply = () => {
    const filter: FilterProxies = {
      countries: countries.trim() ? countries.split(',').map(c => c.trim()) : undefined,
      regions: regions.trim() ? regions.split(',').map(r => r.trim()) : undefined,
      city: city.trim() || undefined,
      speed: speed ? Number(speed)/1000 : undefined,
      reliability: reliability ? Number(reliability)/100 : undefined,
      anons: anons.length ? anons.map(Number) : undefined,
      protocs: protocs.length ? protocs.map(Number) : undefined,
      last_check: lastCheck ? Number(lastCheck) : undefined,
      accessible_websites: websites.trim() ? websites.split(',').map(w => w.trim()) : undefined,
      limit: limit ? Number(limit) : 20,
    }
    onApply(filter)
    onClose()
  }

  return (
    <Modal title="Filter Proxies" opened={opened} onClose={onClose} size="lg">
      <Stack gap="md">
        <TextInput
          label="Countries (comma-separated)"
          placeholder="US, GB, DE"
          value={countries}
          onChange={(e) => setCountries(e.currentTarget.value)}
        />

        <TextInput
          label="Regions (comma-separated)"
          placeholder="California, Texas"
          value={regions}
          onChange={(e) => setRegions(e.currentTarget.value)}
        />

        <TextInput
          label="City"
          placeholder="New York"
          value={city}
          onChange={(e) => setCity(e.currentTarget.value)}
        />

        <NumberInput
          label="max load time (ms)"
          placeholder="1000"
          value={speed}
          onChange={setSpeed}
          min={0}
        />

        <NumberInput
          label="Min Reliability (%)"
          placeholder="50"
          value={reliability}
          onChange={setReliability}
          min={0}
          max={100}
        />

        <MultiSelect
          label="Anonymity Levels"
          placeholder="Select anonymity levels"
          data={ANONYMITY_LEVELS.map(a => ({
            value: String(a.value),
            label: a.label,
          }))}
          value={anons}
          onChange={setAnons}
          searchable
          clearable
        />

        <MultiSelect
          label="Protocols"
          placeholder="Select protocols"
          data={PROTOCOL_OPTIONS}
          value={protocs}
          onChange={setProtocs}
          searchable
          clearable
        />

        <NumberInput
          label="Last Check (seconds ago)"
          placeholder="Enter max age"
          value={lastCheck}
          onChange={setLastCheck}
          min={0}
        />

        <TextInput
          label="Accessible Websites (comma-separated)"
          placeholder="google.com, reddit.com"
          value={websites}
          onChange={(e) => setWebsites(e.currentTarget.value)}
        />

        <NumberInput
          label="Result Limit"
          placeholder="Number of proxies"
          value={limit}
          onChange={setLimit}
          min={1}
          max={10000}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply Filter</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
