import { useState } from 'react'
import { Modal, Button, Stack, Group, TextInput, Alert } from '@mantine/core'

interface CreateUserModalProps {
  opened: boolean
  onClose: () => void
  onCreate: (email: string, password: string) => Promise<void>
  isLoading?: boolean
}

export function CreateUserModal({
  opened,
  onClose,
  onCreate,
  isLoading = false,
}: CreateUserModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      return
    }

    try {
      setError('')
      await onCreate(email, password)
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setError('')
    onClose()
  }

  return (
    <Modal title="Create New User" opened={opened} onClose={handleClose}>
      <Stack gap="md">
        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        <TextInput
          label="Email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          disabled={isLoading}
          type="email"
        />

        <TextInput
          label="Password"
          placeholder="Enter a password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          disabled={isLoading}
          type="password"
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
