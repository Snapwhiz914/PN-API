import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Container, Stack, Title, Button, Group, Alert, Loader, Center, TextInput, NumberInput, Switch, Card, Text, Tabs, Badge, Anchor, } from '@mantine/core';
import { getSettings, updateSettings, getStatistics, getAvailableBlacklistFiles } from '../api/scanner';
export function ScannerSettingsPage({ onNavigateToHome }) {
    const [settings, setSettings] = useState(null);
    const [stats, setStats] = useState(null);
    const [availableBlacklistFiles, setAvailableBlacklistFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    // Fetch settings, stats, and available blacklist files on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                const [settingsData, statsData, blacklistFilesData] = await Promise.all([
                    getSettings(),
                    getStatistics(),
                    getAvailableBlacklistFiles(),
                ]);
                setSettings(settingsData);
                setStats(statsData);
                setAvailableBlacklistFiles(blacklistFilesData);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load scanner settings');
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    const handleSettingsChange = (key, value) => {
        if (settings) {
            setSettings({
                ...settings,
                [key]: value,
            });
        }
    };
    const handleWebsiteChange = (index, field, value) => {
        if (settings && settings.websites) {
            const newWebsites = [...settings.websites];
            newWebsites[index] = {
                ...newWebsites[index],
                [field]: value,
            };
            setSettings({
                ...settings,
                websites: newWebsites,
            });
        }
    };
    const handleAddWebsite = () => {
        if (settings && settings.websites) {
            setSettings({
                ...settings,
                websites: [
                    ...settings.websites,
                    { url: '', timeout_seconds: 10, mark_dead_on_fail: true },
                ],
            });
        }
    };
    const handleRemoveWebsite = (index) => {
        if (settings && settings.websites) {
            setSettings({
                ...settings,
                websites: settings.websites.filter((_, i) => i !== index),
            });
        }
    };
    const handleToggleBlacklistFile = (filename) => {
        if (settings) {
            const newFiles = settings.blacklist_files.includes(filename)
                ? settings.blacklist_files.filter((f) => f !== filename)
                : [...settings.blacklist_files, filename];
            setSettings({
                ...settings,
                blacklist_files: newFiles,
            });
        }
    };
    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccessMessage('');
            if (!settings)
                return;
            await updateSettings(settings);
            setSuccessMessage('Scanner settings updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (_jsx(Container, { size: "lg", py: "xl", children: _jsx(Center, { children: _jsx(Loader, {}) }) }));
    }
    if (!settings) {
        return (_jsx(Container, { size: "lg", py: "xl", children: _jsx(Alert, { color: "red", title: "Error", children: "Failed to load scanner settings" }) }));
    }
    return (_jsx(Container, { size: "lg", py: "xl", children: _jsxs(Stack, { gap: "lg", children: [_jsxs(Group, { justify: "space-between", align: "center", children: [_jsx(Title, { children: "Scanner Settings" }), _jsxs(Group, { children: [_jsx(Button, { onClick: handleSaveSettings, loading: saving, children: "Save Settings" }), onNavigateToHome && (_jsx(Button, { variant: "light", onClick: onNavigateToHome, children: "Back to Home" }))] })] }), error && (_jsx(Alert, { color: "red", title: "Error", children: error })), successMessage && (_jsx(Alert, { color: "green", title: "Success", children: successMessage })), _jsxs(Tabs, { defaultValue: "general", children: [_jsxs(Tabs.List, { children: [_jsx(Tabs.Tab, { value: "general", children: "General Settings" }), _jsx(Tabs.Tab, { value: "websites", children: "Websites" }), _jsx(Tabs.Tab, { value: "blacklist", children: "Blacklist" }), _jsx(Tabs.Tab, { value: "statistics", children: "Statistics" })] }), _jsx(Tabs.Panel, { value: "general", pt: "md", children: _jsx(Card, { withBorder: true, padding: "lg", radius: "md", children: _jsxs(Stack, { gap: "md", children: [_jsx(NumberInput, { label: "Number of Scan Threads", description: "Number of concurrent threads for proxy scanning. Modifying this value while the scanner is running will kill all current scan threads and restart the specified number", value: settings.num_scan_threads, onChange: (val) => handleSettingsChange('num_scan_threads', val), min: 1, max: 1000 }), _jsx(NumberInput, { label: "Alive Check Interval (minutes)", description: "How often to re-check alive proxies", value: settings.alive_check_interval_minutes, onChange: (val) => handleSettingsChange('alive_check_interval_minutes', val), min: 1 }), _jsx(NumberInput, { label: "Dead Check Interval (minutes)", description: "How often to re-check dead proxies", value: settings.dead_check_interval_minutes, onChange: (val) => handleSettingsChange('dead_check_interval_minutes', val), min: 1 }), _jsx(NumberInput, { label: "Scan Check Timeout (seconds)", description: "Timeout for each proxy validation request", value: settings.scan_check_timeout_seconds, onChange: (val) => handleSettingsChange('scan_check_timeout_seconds', val), min: 1, max: 30 })] }) }) }), _jsx(Tabs.Panel, { value: "websites", pt: "md", children: _jsx(Card, { withBorder: true, padding: "lg", radius: "md", children: _jsxs(Stack, { gap: "md", children: [settings.websites.map((website, index) => (_jsx(Card, { withBorder: true, padding: "md", radius: "sm", bg: "gray.9", children: _jsxs(Stack, { gap: "md", children: [_jsxs(Group, { justify: "space-between", children: [_jsxs(Text, { fw: 500, children: ["Website ", index + 1] }), settings.websites.length > 1 && (_jsx(Button, { variant: "subtle", color: "red", size: "xs", onClick: () => handleRemoveWebsite(index), children: "Remove" }))] }), _jsx(TextInput, { label: "URL", placeholder: "https://example.com", value: website.url, onChange: (e) => handleWebsiteChange(index, 'url', e.currentTarget.value) }), _jsx(NumberInput, { label: "Timeout (seconds)", value: website.timeout_seconds, onChange: (val) => handleWebsiteChange(index, 'timeout_seconds', val), min: 1, max: 60 }), _jsx(Switch, { label: "Mark as dead on failure", checked: website.mark_dead_on_fail, onChange: (e) => handleWebsiteChange(index, 'mark_dead_on_fail', e.currentTarget.checked) })] }) }, index))), _jsx(Button, { onClick: handleAddWebsite, variant: "light", children: "Add Website" })] }) }) }), _jsx(Tabs.Panel, { value: "blacklist", pt: "md", children: _jsx(Card, { withBorder: true, padding: "lg", radius: "md", children: _jsxs(Stack, { gap: "md", children: [_jsx(Group, { justify: "space-between", align: "flex-start", children: _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", children: "Select which blacklist files to use for filtering proxies" }), _jsx(Anchor, { href: "https://github.com/firehol/blocklist-ipsets", target: "_blank", size: "sm", mt: "xs", children: "View blocklist-ipsets on GitHub \u2192" })] }) }), _jsx(Stack, { gap: "xs", children: availableBlacklistFiles.length > 0 ? (availableBlacklistFiles.map((filename) => (_jsx(Switch, { label: filename, checked: settings.blacklist_files.includes(filename), onChange: () => handleToggleBlacklistFile(filename) }, filename)))) : (_jsx(Text, { size: "sm", c: "dimmed", children: "No blacklist files found" })) })] }) }) }), _jsx(Tabs.Panel, { value: "statistics", pt: "md", children: stats ? (_jsx(Card, { withBorder: true, padding: "lg", radius: "md", children: _jsx(Stack, { gap: "md", children: _jsxs(Group, { justify: "space-around", children: [_jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", children: "Check Queue Size" }), _jsx(Badge, { size: "lg", variant: "light", children: stats.check_queue_size })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", children: "Non-Blacklisted IPs" }), _jsx(Badge, { size: "lg", variant: "light", color: "green", children: stats.non_blacklisted_ips })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", children: "Blacklisted IPs" }), _jsx(Badge, { size: "lg", variant: "light", color: "red", children: stats.blacklisted_ips })] })] }) }) })) : (_jsx(Loader, {})) })] })] }) }));
}
