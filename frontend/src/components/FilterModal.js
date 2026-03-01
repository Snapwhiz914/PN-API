import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Modal, Button, Stack, Group, TextInput, NumberInput, MultiSelect, } from '@mantine/core';
import { ANONYMITY_LEVELS } from '../api/profiles';
const PROTOCOL_OPTIONS = [
    { value: '0', label: 'HTTP' },
    { value: '1', label: 'HTTPS' },
    { value: '2', label: 'SOCKS4' },
    { value: '3', label: 'SOCKS5' },
];
export function FilterModal({ opened, onClose, onApply, initialFilter, }) {
    const [countries, setCountries] = useState(initialFilter?.countries?.join(', ') || '');
    const [regions, setRegions] = useState(initialFilter?.regions?.join(', ') || '');
    const [city, setCity] = useState(initialFilter?.city || '');
    const [speed, setSpeed] = useState(initialFilter?.speed || '');
    const [reliability, setReliability] = useState(initialFilter?.reliability || '');
    const [anons, setAnons] = useState((initialFilter?.anons?.map(String) || []));
    const [protocs, setProtocs] = useState((initialFilter?.protocs?.map(String) || []));
    const [lastCheck, setLastCheck] = useState(initialFilter?.last_check || '');
    const [websites, setWebsites] = useState(initialFilter?.accessible_websites?.join(', ') || '');
    const [limit, setLimit] = useState(initialFilter?.limit || 20);
    const handleApply = () => {
        const filter = {
            countries: countries.trim() ? countries.split(',').map(c => c.trim()) : undefined,
            regions: regions.trim() ? regions.split(',').map(r => r.trim()) : undefined,
            city: city.trim() || undefined,
            speed: speed ? Number(speed) / 1000 : undefined,
            reliability: reliability ? Number(reliability) / 100 : undefined,
            anons: anons.length ? anons.map(Number) : undefined,
            protocs: protocs.length ? protocs.map(Number) : undefined,
            last_check: lastCheck ? Number(lastCheck) : undefined,
            accessible_websites: websites.trim() ? websites.split(',').map(w => w.trim()) : undefined,
            limit: limit ? Number(limit) : 20,
        };
        onApply(filter);
        onClose();
    };
    return (_jsx(Modal, { title: "Filter Proxies", opened: opened, onClose: onClose, size: "lg", children: _jsxs(Stack, { gap: "md", children: [_jsx(TextInput, { label: "Countries (comma-separated)", placeholder: "US, GB, DE", value: countries, onChange: (e) => setCountries(e.currentTarget.value) }), _jsx(TextInput, { label: "Regions (comma-separated)", placeholder: "California, Texas", value: regions, onChange: (e) => setRegions(e.currentTarget.value) }), _jsx(TextInput, { label: "City", placeholder: "New York", value: city, onChange: (e) => setCity(e.currentTarget.value) }), _jsx(NumberInput, { label: "max load time (ms)", placeholder: "1000", value: speed, onChange: setSpeed, min: 0 }), _jsx(NumberInput, { label: "Min Reliability (%)", placeholder: "50", value: reliability, onChange: setReliability, min: 0, max: 100 }), _jsx(MultiSelect, { label: "Anonymity Levels", placeholder: "Select anonymity levels", data: ANONYMITY_LEVELS.map(a => ({
                        value: String(a.value),
                        label: a.label,
                    })), value: anons, onChange: setAnons, searchable: true, clearable: true }), _jsx(MultiSelect, { label: "Protocols", placeholder: "Select protocols", data: PROTOCOL_OPTIONS, value: protocs, onChange: setProtocs, searchable: true, clearable: true }), _jsx(NumberInput, { label: "Last Check (seconds ago)", placeholder: "Enter max age", value: lastCheck, onChange: setLastCheck, min: 0 }), _jsx(TextInput, { label: "Accessible Websites (comma-separated)", placeholder: "google.com, reddit.com", value: websites, onChange: (e) => setWebsites(e.currentTarget.value) }), _jsx(NumberInput, { label: "Result Limit", placeholder: "Number of proxies", value: limit, onChange: setLimit, min: 1, max: 10000 }), _jsxs(Group, { justify: "flex-end", children: [_jsx(Button, { variant: "default", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleApply, children: "Apply Filter" })] })] }) }));
}
