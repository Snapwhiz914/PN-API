import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Modal, Button, Stack, Group, TextInput, Alert } from '@mantine/core';
export function CreateProfileModal({ opened, onClose, onCreate, isLoading = false, }) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Profile name is required');
            return;
        }
        try {
            setError('');
            await onCreate(name, { limit: 20 });
            setName('');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create profile');
        }
    };
    const handleClose = () => {
        setName('');
        setError('');
        onClose();
    };
    return (_jsx(Modal, { title: "Create New Profile", opened: opened, onClose: handleClose, children: _jsxs(Stack, { gap: "md", children: [error && (_jsx(Alert, { color: "red", title: "Error", children: error })), _jsx(TextInput, { label: "Profile Name", placeholder: "e.g., My Fast Proxies", value: name, onChange: (e) => setName(e.currentTarget.value), disabled: isLoading }), _jsxs(Group, { justify: "flex-end", children: [_jsx(Button, { variant: "default", onClick: handleClose, disabled: isLoading, children: "Cancel" }), _jsx(Button, { onClick: handleCreate, loading: isLoading, disabled: isLoading, children: "Create" })] })] }) }));
}
