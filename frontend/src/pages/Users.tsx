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
  Text,
} from '@mantine/core'
import { getAllUsers, createUser, deleteUser, User } from '../api/user'
import { UserItem } from '../components/UserItem'
import { CreateUserModal } from '../components/CreateUserModal'

interface UsersProps {
  onNavigateToHome?: () => void
}

export function Users({ onNavigateToHome }: UsersProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Fetch users on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        const allUsers = await getAllUsers()
        setUsers(allUsers)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateUser = async (email: string, password: string) => {
    try {
      setCreating(true)
      await createUser(email, password)
      // Refresh the user list after creation
      const allUsers = await getAllUsers()
      setUsers(allUsers)
      setCreateModalOpen(false)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (email: string) => {
    await deleteUser(email)
    setUsers(users.filter((u) => u.email !== email))
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

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title>User Management</Title>
          <Group>
            <Button onClick={() => setCreateModalOpen(true)}>Create User</Button>
            {onNavigateToHome && <Button variant="light" onClick={onNavigateToHome}>Back to Home</Button>}
          </Group>
        </Group>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {users.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">No users found.</Text>
          </Center>
        ) : (
          <Stack gap="md">
            {users.map((user) => (
              <UserItem
                key={user.id}
                user={user}
                onDelete={handleDeleteUser}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <CreateUserModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateUser}
        isLoading={creating}
      />
    </Container>
  )
}
