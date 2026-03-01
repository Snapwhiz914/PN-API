import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Container, Stack, Title, Button, Group, Alert, Loader, Center, Text, } from '@mantine/core';
import { getAllUsers, createUser, deleteUser } from '../api/user';
import { UserItem } from '../components/UserItem';
import { CreateUserModal } from '../components/CreateUserModal';
export function Users({ onNavigateToHome }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    // Fetch users on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                const allUsers = await getAllUsers();
                setUsers(allUsers);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load users');
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    const handleCreateUser = async (email, password) => {
        try {
            setCreating(true);
            await createUser(email, password);
            // Refresh the user list after creation
            const allUsers = await getAllUsers();
            setUsers(allUsers);
            setCreateModalOpen(false);
        }
        finally {
            setCreating(false);
        }
    };
    const handleDeleteUser = async (email) => {
        await deleteUser(email);
        setUsers(users.filter((u) => u.email !== email));
    };
    if (loading) {
        return (_jsx(Container, { size: "lg", py: "xl", children: _jsx(Center, { children: _jsx(Loader, {}) }) }));
    }
    return (_jsxs(Container, { size: "lg", py: "xl", children: [_jsxs(Stack, { gap: "lg", children: [_jsxs(Group, { justify: "space-between", align: "center", children: [_jsx(Title, { children: "User Management" }), _jsxs(Group, { children: [_jsx(Button, { onClick: () => setCreateModalOpen(true), children: "Create User" }), onNavigateToHome && _jsx(Button, { variant: "light", onClick: onNavigateToHome, children: "Back to Home" })] })] }), error && (_jsx(Alert, { color: "red", title: "Error", children: error })), users.length === 0 ? (_jsx(Center, { py: "xl", children: _jsx(Text, { c: "dimmed", children: "No users found." }) })) : (_jsx(Stack, { gap: "md", children: users.map((user) => (_jsx(UserItem, { user: user, onDelete: handleDeleteUser }, user.id))) }))] }), _jsx(CreateUserModal, { opened: createModalOpen, onClose: () => setCreateModalOpen(false), onCreate: handleCreateUser, isLoading: creating })] }));
}
