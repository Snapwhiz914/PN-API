import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Paper, Group, Stack, Button, Badge, Text, Alert, Modal, } from '@mantine/core';
export function UserItem({ user, onDelete, isLoading = false, }) {
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const handleDelete = async () => {
        try {
            setActionLoading(true);
            setError('');
            await onDelete(user.email);
            setDeleteConfirmOpen(false);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
        }
        finally {
            setActionLoading(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Paper, { p: "md", radius: "md", withBorder: true, children: [error && (_jsx(Alert, { color: "red", title: "Error", mb: "md", children: error })), _jsxs(Group, { justify: "space-between", align: "center", children: [_jsx(Stack, { gap: "xs", style: { flex: 1 }, children: _jsxs(Group, { gap: "md", align: "center", children: [_jsx(Text, { fw: 500, children: user.email }), user.admin && (_jsx(Badge, { color: "blue", variant: "dot", children: "Admin" }))] }) }), _jsx(Button, { color: "red", variant: "light", onClick: () => setDeleteConfirmOpen(true), disabled: actionLoading || isLoading || user.admin, children: "Delete" })] })] }), _jsx(Modal, { title: "Confirm Delete", opened: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), centered: true, children: _jsxs(Stack, { gap: "md", children: [_jsxs(Text, { children: ["Are you sure you want to delete ", user.email, "?"] }), _jsxs(Group, { justify: "flex-end", children: [_jsx(Button, { variant: "default", onClick: () => setDeleteConfirmOpen(false), children: "Cancel" }), _jsx(Button, { color: "red", onClick: handleDelete, loading: actionLoading, disabled: actionLoading, children: "Delete" })] })] }) })] }));
}
