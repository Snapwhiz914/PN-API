import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Modal, Button, Stack, Group, TextInput, Alert } from '@mantine/core';
export function CreateUserModal({ opened, onClose, onCreate, isLoading = false, }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleCreate = async () => {
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            return;
        }
        try {
            setError('');
            await onCreate(email, password);
            setEmail('');
            setPassword('');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
        }
    };
    const handleClose = () => {
        setEmail('');
        setPassword('');
        setError('');
        onClose();
    };
    return (_jsx(Modal, { title: "Create New User", opened: opened, onClose: handleClose, children: _jsxs(Stack, { gap: "md", children: [error && (_jsx(Alert, { color: "red", title: "Error", children: error })), _jsx(TextInput, { label: "Email", placeholder: "user@example.com", value: email, onChange: (e) => setEmail(e.currentTarget.value), disabled: isLoading, type: "email" }), _jsx(TextInput, { label: "Password", placeholder: "Enter a password", value: password, onChange: (e) => setPassword(e.currentTarget.value), disabled: isLoading, type: "password" }), _jsxs(Group, { justify: "flex-end", children: [_jsx(Button, { variant: "default", onClick: handleClose, disabled: isLoading, children: "Cancel" }), _jsx(Button, { onClick: handleCreate, loading: isLoading, disabled: isLoading, children: "Create" })] })] }) }));
}
