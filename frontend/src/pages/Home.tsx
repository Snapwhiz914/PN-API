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
  Tabs,
  Text,
} from '@mantine/core'
import {
  getProfiles,
  createProfile,
  deleteProfile,
  updateProfile,
  activateProfile,
  deactivateProfile,
  Profile,
  FilterProxies,
} from '../api/profiles'
import { getMe } from '../api/user'
import { ProfileItem } from '../components/ProfileItem'
import { CreateProfileModal } from '../components/CreateProfileModal'

interface HomeProps {
  onNavigateToMap?: () => void
}

export function Home({ onNavigateToMap }: HomeProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Fetch user info and profiles on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        // Get user info
        const userInfo = await getMe()
        setUserEmail(userInfo.email)
        setIsAdmin(userInfo.admin)

        // Get all profiles
        const allProfs = await getProfiles()
        setAllProfiles(allProfs)

        // Filter user's own profiles
        const userProfiles = allProfs.filter((p) => p.owner.email === userInfo.email)
        setProfiles(userProfiles)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profiles')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateProfile = async (name: string, filter: FilterProxies) => {
    try {
      setCreating(true)
      const newProfile = await createProfile(name, filter)
      setProfiles([...profiles, newProfile])
      if (allProfiles) {
        setAllProfiles([...allProfiles, newProfile])
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProfile = async (profileId: string) => {
    await deleteProfile(profileId)
    setProfiles(profiles.filter((p) => p.id !== profileId))
    setAllProfiles(allProfiles.filter((p) => p.id !== profileId))
  }

  const handleToggleActive = async (profileId: string, active: boolean) => {
    const updated = active ? await activateProfile(profileId) : await deactivateProfile(profileId)
    setProfiles(profiles.map((p) => (p.id === profileId ? updated : p)))
    setAllProfiles(allProfiles.map((p) => (p.id === profileId ? updated : p)))
  }

  const handleUpdateFilter = async (profileId: string, filter: FilterProxies) => {
    const updated = await updateProfile(profileId, { proxies: filter })
    setProfiles(profiles.map((p) => (p.id === profileId ? updated : p)))
    setAllProfiles(allProfiles.map((p) => (p.id === profileId ? updated : p)))
  }

  const handleGeneratePAC = async (profileId: string) => {
    try {
      const pacUrl = `${window.location.origin}/api/profiles/${profileId}/pac`
      await navigator.clipboard.writeText(pacUrl)
      alert('PAC link copied to clipboard!')
    } catch (err) {
      alert('Failed to copy link to clipboard')
      console.error(err)
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

  const otherProfiles = allProfiles.filter((p) => p.owner.email !== userEmail)

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title>My Profiles</Title>
          <Group>
            <Button onClick={() => setCreateModalOpen(true)}>Create Profile</Button>
            {onNavigateToMap && <Button variant="light" onClick={onNavigateToMap}>View Map</Button>}
          </Group>
        </Group>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        <Tabs defaultValue="own">
          <Tabs.List>
            <Tabs.Tab value="own">My Profiles ({profiles.length})</Tabs.Tab>
            {isAdmin && (
              <Tabs.Tab value="other">Other Users ({otherProfiles.length})</Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="own" pt="md">
            {profiles.length === 0 ? (
              <Center py="xl">
                <Text c="dimmed">No profiles yet. Create one to get started!</Text>
              </Center>
            ) : (
              <Stack gap="md">
                {profiles.map((profile) => (
                  <ProfileItem
                    key={profile.id}
                    profile={profile}
                    isOwner={true}
                    onDelete={handleDeleteProfile}
                    onToggleActive={handleToggleActive}
                    onUpdateFilter={handleUpdateFilter}
                    onGeneratePAC={handleGeneratePAC}
                  />
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          {isAdmin && (
            <Tabs.Panel value="other" pt="md">
              {otherProfiles.length === 0 ? (
                <Center py="xl">
                  <Text c="dimmed">No other user profiles.</Text>
                </Center>
              ) : (
                <Stack gap="md">
                  {otherProfiles.map((profile) => (
                    <ProfileItem
                      key={profile.id}
                      profile={profile}
                      isOwner={false}
                      onDelete={handleDeleteProfile}
                      onToggleActive={handleToggleActive}
                      onUpdateFilter={handleUpdateFilter}
                      onGeneratePAC={handleGeneratePAC}
                    />
                  ))}
                </Stack>
              )}
            </Tabs.Panel>
          )}
        </Tabs>
      </Stack>

      <CreateProfileModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateProfile}
        isLoading={creating}
      />
    </Container>
  )
}
