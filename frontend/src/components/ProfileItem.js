import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Paper, Group, Stack, Button, Badge, Text, Menu, Alert, Modal, } from '@mantine/core';
import { FilterModal } from './FilterModal';
export function ProfileItem({ profile, isOwner, onDelete, onToggleActive, onUpdateFilter, onGeneratePAC, isLoading = false, }) {
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const handleDelete = async () => {
        try {
            setActionLoading(true);
            setError('');
            await onDelete(profile.id);
            setDeleteConfirmOpen(false);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete profile');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleToggleActive = async () => {
        try {
            setActionLoading(true);
            setError('');
            await onToggleActive(profile.id, !profile.active);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleGeneratePAC = async () => {
        try {
            setActionLoading(true);
            setError('');
            await onGeneratePAC(profile.id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate PAC');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleFilterApply = async (filter) => {
        try {
            setActionLoading(true);
            setError('');
            await onUpdateFilter(profile.id, filter);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update filter');
        }
        finally {
            setActionLoading(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Paper, { p: "md", radius: "md", withBorder: true, children: [error && (_jsx(Alert, { color: "red", title: "Error", mb: "md", children: error })), _jsxs(Group, { justify: "space-between", align: "flex-start", children: [_jsxs(Stack, { gap: "xs", style: { flex: 1 }, children: [_jsxs(Group, { gap: "md", align: "center", children: [_jsx(Text, { fw: 500, children: profile.name }), _jsx(Badge, { color: profile.active ? 'green' : 'gray', variant: "dot", children: profile.active ? 'Active' : 'Inactive' })] }), !isOwner && (_jsxs(Text, { size: "sm", c: "dimmed", children: ["Owner: ", profile.owner.email] })), _jsxs(Text, { size: "sm", c: "dimmed", children: ["Limit: ", profile.proxies.limit || 20, " proxies"] })] }), _jsx(Group, { gap: "xs", children: _jsxs(Menu, { shadow: "md", position: "bottom-end", children: [_jsx(Menu.Target, { children: _jsx(Button, { variant: "light", disabled: actionLoading || isLoading, children: "Actions" }) }), _jsxs(Menu.Dropdown, { children: [_jsx(Menu.Item, { onClick: handleGeneratePAC, disabled: actionLoading || isLoading, children: "Generate PAC" }), _jsx(Menu.Item, { onClick: () => setFilterModalOpen(true), disabled: actionLoading || isLoading, children: "Change Filter" }), _jsx(Menu.Divider, {}), _jsx(Menu.Item, { onClick: handleToggleActive, disabled: actionLoading || isLoading, children: profile.active ? 'Deactivate' : 'Activate' }), _jsx(Menu.Item, { color: "red", onClick: () => setDeleteConfirmOpen(true), disabled: actionLoading || isLoading, children: "Delete" })] })] }) })] })] }), _jsx(FilterModal, { opened: filterModalOpen, onClose: () => setFilterModalOpen(false), onApply: handleFilterApply, initialFilter: profile.proxies }), _jsx(Modal, { opened: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), title: "Delete Profile", children: _jsxs(Stack, { gap: "md", children: [_jsxs(Text, { children: ["Are you sure you want to delete \"", profile.name, "\"? This action cannot be undone."] }), _jsxs(Group, { justify: "flex-end", children: [_jsx(Button, { variant: "default", onClick: () => setDeleteConfirmOpen(false), disabled: actionLoading, children: "Cancel" }), _jsx(Button, { color: "red", onClick: handleDelete, loading: actionLoading, disabled: actionLoading, children: "Delete" })] })] }) })] }));
}
