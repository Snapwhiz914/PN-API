import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Container, Stack, Title, Button, Group, Alert, Loader, Center, Tabs, Text, } from '@mantine/core';
import { getProfiles, createProfile, deleteProfile, updateProfile, activateProfile, deactivateProfile, } from '../api/profiles';
import { getMe } from '../api/user';
import { ProfileItem } from '../components/ProfileItem';
import { CreateProfileModal } from '../components/CreateProfileModal';
export function Home({ onNavigateToMap, onNavigateToUsers, onNavigateToScannerSettings, onNavigateToAnalytics }) {
    const [profiles, setProfiles] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    // Fetch user info and profiles on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                // Get user info
                const userInfo = await getMe();
                setUserEmail(userInfo.email);
                setIsAdmin(userInfo.admin);
                // Get all profiles
                const allProfs = await getProfiles();
                setAllProfiles(allProfs);
                // Filter user's own profiles
                const userProfiles = allProfs.filter((p) => p.owner.email === userInfo.email);
                setProfiles(userProfiles);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load profiles');
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    const handleCreateProfile = async (name, filter) => {
        try {
            setCreating(true);
            const newProfile = await createProfile(name, filter);
            setProfiles([...profiles, newProfile]);
            if (allProfiles) {
                setAllProfiles([...allProfiles, newProfile]);
            }
        }
        finally {
            setCreating(false);
        }
    };
    const handleDeleteProfile = async (profileId) => {
        await deleteProfile(profileId);
        setProfiles(profiles.filter((p) => p.id !== profileId));
        setAllProfiles(allProfiles.filter((p) => p.id !== profileId));
    };
    const handleToggleActive = async (profileId, active) => {
        const updated = active ? await activateProfile(profileId) : await deactivateProfile(profileId);
        setProfiles(profiles.map((p) => (p.id === profileId ? updated : p)));
        setAllProfiles(allProfiles.map((p) => (p.id === profileId ? updated : p)));
    };
    const handleUpdateFilter = async (profileId, filter) => {
        const updated = await updateProfile(profileId, { proxies: filter });
        setProfiles(profiles.map((p) => (p.id === profileId ? updated : p)));
        setAllProfiles(allProfiles.map((p) => (p.id === profileId ? updated : p)));
    };
    const handleGeneratePAC = async (profileId) => {
        try {
            const pacUrl = `${window.location.origin}/api/profiles/${profileId}/pac`;
            await navigator.clipboard.writeText(pacUrl);
            alert('PAC link copied to clipboard!');
        }
        catch (err) {
            alert('Failed to copy link to clipboard');
            console.error(err);
        }
    };
    if (loading) {
        return (_jsx(Container, { size: "lg", py: "xl", children: _jsx(Center, { children: _jsx(Loader, {}) }) }));
    }
    const otherProfiles = allProfiles.filter((p) => p.owner.email !== userEmail);
    return (_jsxs(Container, { size: "lg", py: "xl", children: [_jsxs(Stack, { gap: "lg", children: [_jsxs(Group, { justify: "space-between", align: "center", children: [_jsx(Title, { children: "My Profiles" }), _jsxs(Group, { children: [_jsx(Button, { onClick: () => setCreateModalOpen(true), children: "Create Profile" }), isAdmin && (_jsxs(_Fragment, { children: [onNavigateToUsers && (_jsx(Button, { variant: "light", onClick: onNavigateToUsers, children: "Manage Users" })), onNavigateToScannerSettings && (_jsx(Button, { variant: "light", onClick: onNavigateToScannerSettings, children: "Scanner Settings" }))] })), onNavigateToAnalytics && _jsx(Button, { variant: "light", onClick: onNavigateToAnalytics, children: "Analytics" }), onNavigateToMap && _jsx(Button, { variant: "light", onClick: onNavigateToMap, children: "View Map" })] })] }), error && (_jsx(Alert, { color: "red", title: "Error", children: error })), _jsxs(Tabs, { defaultValue: "own", children: [_jsxs(Tabs.List, { children: [_jsxs(Tabs.Tab, { value: "own", children: ["My Profiles (", profiles.length, ")"] }), isAdmin && (_jsxs(Tabs.Tab, { value: "other", children: ["Other Users (", otherProfiles.length, ")"] }))] }), _jsx(Tabs.Panel, { value: "own", pt: "md", children: profiles.length === 0 ? (_jsx(Center, { py: "xl", children: _jsx(Text, { c: "dimmed", children: "No profiles yet. Create one to get started!" }) })) : (_jsx(Stack, { gap: "md", children: profiles.map((profile) => (_jsx(ProfileItem, { profile: profile, isOwner: true, onDelete: handleDeleteProfile, onToggleActive: handleToggleActive, onUpdateFilter: handleUpdateFilter, onGeneratePAC: handleGeneratePAC }, profile.id))) })) }), isAdmin && (_jsx(Tabs.Panel, { value: "other", pt: "md", children: otherProfiles.length === 0 ? (_jsx(Center, { py: "xl", children: _jsx(Text, { c: "dimmed", children: "No other user profiles." }) })) : (_jsx(Stack, { gap: "md", children: otherProfiles.map((profile) => (_jsx(ProfileItem, { profile: profile, isOwner: false, onDelete: handleDeleteProfile, onToggleActive: handleToggleActive, onUpdateFilter: handleUpdateFilter, onGeneratePAC: handleGeneratePAC }, profile.id))) })) }))] })] }), _jsx(CreateProfileModal, { opened: createModalOpen, onClose: () => setCreateModalOpen(false), onCreate: handleCreateProfile, isLoading: creating })] }));
}
