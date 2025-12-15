import { useState } from 'react'
import {
  Paper,
  Group,
  Stack,
  Button,
  Badge,
  Text,
  Menu,
  Alert,
  Modal,
} from '@mantine/core'
import { Profile, FilterProxies } from '../api/profiles'
import { FilterModal } from './FilterModal'

interface ProfileItemProps {
  profile: Profile
  isOwner: boolean
  onDelete: (profileId: string) => Promise<void>
  onToggleActive: (profileId: string, active: boolean) => Promise<void>
  onUpdateFilter: (profileId: string, filter: FilterProxies) => Promise<void>
  onGeneratePAC: (profileId: string) => Promise<void>
  isLoading?: boolean
}

export function ProfileItem({
  profile,
  isOwner,
  onDelete,
  onToggleActive,
  onUpdateFilter,
  onGeneratePAC,
  isLoading = false,
}: ProfileItemProps) {
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      setError('')
      await onDelete(profile.id)
      setDeleteConfirmOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      setActionLoading(true)
      setError('')
      await onToggleActive(profile.id, !profile.active)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setActionLoading(false)
    }
  }

  const handleGeneratePAC = async () => {
    try {
      setActionLoading(true)
      setError('')
      await onGeneratePAC(profile.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PAC')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFilterApply = async (filter: FilterProxies) => {
    try {
      setActionLoading(true)
      setError('')
      await onUpdateFilter(profile.id, filter)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update filter')
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

        <Group justify="space-between" align="flex-start">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group gap="md" align="center">
              <Text fw={500}>{profile.name}</Text>
              <Badge
                color={profile.active ? 'green' : 'gray'}
                variant="dot"
              >
                {profile.active ? 'Active' : 'Inactive'}
              </Badge>
            </Group>
            {!isOwner && (
              <Text size="sm" c="dimmed">
                Owner: {profile.owner_email}
              </Text>
            )}
            <Text size="sm" c="dimmed">
              Limit: {profile.filter.limit || 20} proxies
            </Text>
          </Stack>

          <Group gap="xs">
            <Menu shadow="md" position="bottom-end">
              <Menu.Target>
                <Button
                  variant="light"
                  disabled={actionLoading || isLoading}
                >
                  Actions
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  onClick={handleGeneratePAC}
                  disabled={actionLoading || isLoading}
                >
                  Generate PAC
                </Menu.Item>
                <Menu.Item
                  onClick={() => setFilterModalOpen(true)}
                  disabled={actionLoading || isLoading}
                >
                  Change Filter
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={handleToggleActive}
                  disabled={actionLoading || isLoading}
                >
                  {profile.active ? 'Deactivate' : 'Activate'}
                </Menu.Item>
                <Menu.Item
                  color="red"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={actionLoading || isLoading}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Paper>

      <FilterModal
        opened={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleFilterApply}
        initialFilter={profile.filter}
      />

      <Modal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Profile"
      >
        <Stack gap="md">
          <Text>Are you sure you want to delete "{profile.name}"? This action cannot be undone.</Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={actionLoading}
            >
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
