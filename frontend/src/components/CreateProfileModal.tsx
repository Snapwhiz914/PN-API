import { useState } from 'react'
import { Modal, Button, Stack, Group, TextInput, Alert } from '@mantine/core'
import { FilterProxies } from '../api/profiles'

interface CreateProfileModalProps {
  opened: boolean
  onClose: () => void
  onCreate: (name: string, filter: FilterProxies) => Promise<void>
  isLoading?: boolean
}

export function CreateProfileModal({
  opened,
  onClose,
  onCreate,
  isLoading = false,
}: CreateProfileModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Profile name is required')
      return
    }

    try {
      setError('')
      await onCreate(name, { limit: 20 })
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    }
  }

  const handleClose = () => {
    setName('')
    setError('')
    onClose()
  }

  return (
    <Modal title="Create New Profile" opened={opened} onClose={handleClose}>
      <Stack gap="md">
        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        <TextInput
          label="Profile Name"
          placeholder="e.g., My Fast Proxies"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          disabled={isLoading}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={isLoading} disabled={isLoading}>
            Create
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
