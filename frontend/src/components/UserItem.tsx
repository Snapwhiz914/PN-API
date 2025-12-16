import { useState } from 'react'
import {
  Paper,
  Group,
  Stack,
  Button,
  Badge,
  Text,
  Alert,
  Modal,
} from '@mantine/core'
import { User } from '../api/user'

interface UserItemProps {
  user: User
  onDelete: (email: string) => Promise<void>
  isLoading?: boolean
}

export function UserItem({
  user,
  onDelete,
  isLoading = false,
}: UserItemProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      setError('')
      await onDelete(user.email)
      setDeleteConfirmOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <Paper p="md" radius="md" withBorder>
        {error && (
          <Alert color="red" title="Error" mb="md">
            {error}
          </Alert>
        )}

        <Group justify="space-between" align="center">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group gap="md" align="center">
              <Text fw={500}>{user.email}</Text>
              {user.admin && (
                <Badge color="blue" variant="dot">
                  Admin
                </Badge>
              )}
            </Group>
          </Stack>

          <Button
            color="red"
            variant="light"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={actionLoading || isLoading || user.admin}
          >
            Delete
          </Button>
        </Group>
      </Paper>

      <Modal
        title="Confirm Delete"
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        centered
      >
        <Stack gap="md">
          <Text>Are you sure you want to delete {user.email}?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={actionLoading}
              disabled={actionLoading}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
