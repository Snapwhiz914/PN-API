import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Container, Stack, Title, Button, Group, Alert, Loader, Center, Card, Text, Grid, TextInput, NumberInput, Select, Modal, Badge, Paper, SimpleGrid, } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconAlertCircle, IconX } from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, } from 'recharts';
import { getProxies } from '../api/proxies';
import { getHistoricPings } from '../api/scanner';
export function Analytics({ onNavigateHome }) {
    const [aliveProxies, setAliveProxies] = useState([]);
    const [historicPings, setHistoricPings] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    // Filter states
    const [filters, setFilters] = useState({
        limit: 500,
    });
    const [filteredUris, setFilteredUris] = useState(new Set());
    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                // Fetch alive proxies
                const proxies = await getProxies({ limit: 10000 });
                setAliveProxies(proxies);
                // Fetch historic pings
                const pings = await getHistoricPings(filters);
                setHistoricPings(pings);
                // Initialize with all URIs
                const uriSet = new Set(proxies.map((p) => p.uri));
                setFilteredUris(uriSet);
            }
            catch (err) {
                setError(`Failed to load analytics: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    // Process data and build chart whenever historic pings change
    useEffect(() => {
        const processChartData = () => {
            const dataMap = new Map();
            // Filter pings by selected URIs
            const filteredPings = historicPings.filter((ping) => filteredUris.has(ping.uri));
            // Group pings by timestamp and URI
            filteredPings.forEach((ping) => {
                const date = new Date(ping.ping_time);
                const timestamp = date.getTime();
                const key = `${ping.uri}`;
                if (!dataMap.has(timestamp)) {
                    dataMap.set(timestamp, {
                        timestamp,
                        time: date.toLocaleTimeString(),
                    });
                }
                const point = dataMap.get(timestamp);
                // Use speed value, or 0 if there was an error
                point[key] = ping.error_type ? 0 : ping.speed;
            });
            // Sort by timestamp
            const sorted = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
            setChartData(sorted);
        };
        processChartData();
    }, [historicPings, filteredUris]);
    const handleApplyFilters = async () => {
        try {
            setLoading(true);
            const pings = await getHistoricPings(filters);
            setHistoricPings(pings);
        }
        catch (err) {
            setError(`Failed to apply filters: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        finally {
            setLoading(false);
        }
    };
    const handleClearFilters = async () => {
        try {
            setLoading(true);
            setFilters({ limit: 500 });
            const pings = await getHistoricPings({ limit: 500 });
            setHistoricPings(pings);
        }
        catch (err) {
            setError(`Failed to clear filters: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleUri = (uri) => {
        const newUris = new Set(filteredUris);
        if (newUris.has(uri)) {
            newUris.delete(uri);
        }
        else {
            newUris.add(uri);
        }
        setFilteredUris(newUris);
    };
    const showPointDetails = (uri, speed) => {
        const ping = historicPings.find((p) => p.uri === uri &&
            (p.error_type ? 0 : p.speed) === speed &&
            filteredUris.has(p.uri));
        if (ping) {
            setSelectedPoint({
                uri: ping.uri,
                ping_time: ping.ping_time,
                speed: ping.speed,
                error_type: ping.error_type,
                raw_headers: ping.raw_headers,
            });
            setModalOpen(true);
        }
    };
    const getUriColor = (index) => {
        const colors = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
        ];
        return colors[index % colors.length];
    };
    if (loading && !historicPings.length) {
        return (_jsx(Container, { size: "xl", py: "xl", children: _jsx(Center, { style: { minHeight: '400px' }, children: _jsx(Loader, {}) }) }));
    }
    const visibleUris = Array.from(filteredUris).sort();
    return (_jsxs(Container, { size: "xl", py: "xl", children: [_jsxs(Group, { justify: "space-between", mb: "lg", children: [_jsx(Title, { order: 1, children: "Analytics Dashboard" }), _jsx(Button, { variant: "default", onClick: onNavigateHome, children: "Back to Home" })] }), error && (_jsx(Alert, { icon: _jsx(IconAlertCircle, {}), title: "Error", color: "red", mb: "lg", children: error })), _jsxs(Stack, { gap: "lg", children: [_jsxs(Card, { withBorder: true, shadow: "sm", children: [_jsx(Card.Section, { withBorder: true, inheritPadding: true, py: "md", children: _jsx(Title, { order: 2, children: "Proxy Speed Over Time" }) }), _jsx(Card.Section, { inheritPadding: true, pb: "md", children: chartData.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(LineChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time", angle: -45, textAnchor: "end", height: 80 }), _jsx(YAxis, { label: { value: 'Speed (ms)', angle: -90, position: 'insideLeft' } }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(ReferenceLine, { y: 0, stroke: "#ff0000", strokeDasharray: "5 5" }), visibleUris.map((uri, index) => (_jsx(Line, { type: "monotone", dataKey: uri, stroke: getUriColor(index), dot: { r: 4, cursor: 'pointer', onClick: (e) => showPointDetails(uri, e.payload[uri]) }, activeDot: { r: 6 }, isAnimationActive: false }, uri)))] }) })) : (_jsx(Center, { style: { minHeight: '400px' }, children: _jsx(Text, { c: "dimmed", children: "No data available. Try adjusting filters or waiting for scan results." }) })) })] }), _jsxs(Card, { withBorder: true, shadow: "sm", children: [_jsx(Card.Section, { withBorder: true, inheritPadding: true, py: "md", children: _jsx(Title, { order: 2, children: "Filters" }) }), _jsx(Card.Section, { inheritPadding: true, pb: "md", children: _jsxs(Stack, { gap: "md", children: [_jsxs(Grid, { children: [_jsx(Grid.Col, { span: { base: 12, sm: 6, md: 4 }, children: _jsx(TextInput, { label: "Proxy URI", placeholder: "e.g., http://proxy.example.com:8080", value: filters.uri || '', onChange: (e) => setFilters({ ...filters, uri: e.currentTarget.value || undefined }) }) }), _jsx(Grid.Col, { span: { base: 12, sm: 6, md: 4 }, children: _jsx(TextInput, { label: "Headers Keyword", placeholder: "Search in headers", value: filters.raw_headers_keyword || '', onChange: (e) => setFilters({ ...filters, raw_headers_keyword: e.currentTarget.value || undefined }) }) }), _jsx(Grid.Col, { span: { base: 12, sm: 6, md: 4 }, children: _jsx(Select, { label: "Error Type", placeholder: "Select error type", clearable: true, value: filters.error_type || null, onChange: (value) => setFilters({ ...filters, error_type: value || undefined }), data: Array.from(new Set(historicPings.map((p) => p.error_type).filter((e) => e))).map((e) => ({ value: e, label: e })) }) })] }), _jsxs(Grid, { children: [_jsx(Grid.Col, { span: { base: 12, sm: 6, md: 3 }, children: _jsx(NumberInput, { label: "Speed Min (ms)", placeholder: "Minimum speed", min: 0, value: filters.speed_min ?? '', onChange: (value) => setFilters({ ...filters, speed_min: typeof value === 'number' ? value : undefined }) }) }), _jsx(Grid.Col, { span: { base: 12, sm: 6, md: 3 }, children: _jsx(NumberInput, { label: "Speed Max (ms)", placeholder: "Maximum speed", min: 0, value: filters.speed_max ?? '', onChange: (value) => setFilters({ ...filters, speed_max: typeof value === 'number' ? value : undefined }) }) }), _jsx(Grid.Col, { span: { base: 12, sm: 6, md: 4 }, children: _jsx(DateTimePicker, { label: "Start Date", placeholder: "Select start date", value: filters.start_date ? new Date(filters.start_date) : null, onChange: (value) => setFilters({ ...filters, start_date: value || undefined }) }) }), _jsx(Grid.Col, { span: { base: 12, sm: 6, md: 4 }, children: _jsx(DateTimePicker, { label: "End Date", placeholder: "Select end date", value: filters.end_date ? new Date(filters.end_date) : null, onChange: (value) => setFilters({ ...filters, end_date: value || undefined }) }) })] }), _jsxs(Group, { justify: "flex-end", children: [_jsx(Button, { variant: "default", onClick: handleClearFilters, leftSection: _jsx(IconX, { size: 16 }), children: "Clear Filters" }), _jsx(Button, { onClick: handleApplyFilters, loading: loading, children: "Apply Filters" })] })] }) })] }), _jsxs(Card, { withBorder: true, shadow: "sm", children: [_jsx(Card.Section, { withBorder: true, inheritPadding: true, py: "md", children: _jsxs(Group, { justify: "space-between", children: [_jsxs(Title, { order: 2, children: ["Proxies (", visibleUris.length, ")"] }), _jsxs(Group, { gap: "xs", children: [_jsx(Button, { size: "xs", variant: "subtle", onClick: () => setFilteredUris(new Set(aliveProxies.map((p) => p.uri))), children: "Show All" }), _jsx(Button, { size: "xs", variant: "subtle", onClick: () => setFilteredUris(new Set()), children: "Hide All" })] })] }) }), _jsx(Card.Section, { inheritPadding: true, pb: "md", children: _jsx(SimpleGrid, { cols: { base: 1, sm: 2, md: 3, lg: 4 }, spacing: "xs", children: aliveProxies.map((proxy, index) => (_jsx(Paper, { p: "sm", withBorder: true, style: {
                                            cursor: 'pointer',
                                            backgroundColor: filteredUris.has(proxy.uri) ? 'rgba(0, 120, 215, 0.1)' : 'transparent',
                                            borderColor: filteredUris.has(proxy.uri) ? getUriColor(index) : 'var(--mantine-color-gray-4)',
                                            borderWidth: filteredUris.has(proxy.uri) ? 2 : 1,
                                        }, onClick: () => toggleUri(proxy.uri), children: _jsxs(Stack, { gap: 4, children: [_jsx(Text, { size: "xs", fw: 500, truncate: true, title: proxy.uri, children: proxy.uri }), _jsxs(Group, { gap: 4, children: [_jsx(Badge, { size: "xs", variant: "light", children: proxy.protoc }), _jsxs(Badge, { size: "xs", variant: "light", children: [proxy.speed, "ms"] })] })] }) }, proxy.uri))) }) })] })] }), _jsx(Modal, { opened: modalOpen, onClose: () => setModalOpen(false), title: "Ping Details", size: "lg", children: selectedPoint && (_jsxs(Stack, { gap: "md", children: [_jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", children: "Proxy URI" }), _jsx(Text, { fw: 500, style: { wordBreak: 'break-word' }, children: selectedPoint.uri })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", children: "Timestamp" }), _jsx(Text, { fw: 500, children: new Date(selectedPoint.ping_time).toLocaleString() })] }), selectedPoint.error_type ? (_jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", children: "Error" }), _jsx(Badge, { color: "red", children: selectedPoint.error_type })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", children: "Speed" }), _jsxs(Text, { fw: 500, children: [selectedPoint.speed, " ms"] })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", children: "Raw Headers" }), _jsx(Paper, { p: "xs", bg: "dark", style: { overflow: 'auto', maxHeight: '300px' }, children: _jsx(Text, { size: "xs", fw: 400, style: { fontFamily: 'monospace', whiteSpace: 'pre-wrap' }, children: selectedPoint.raw_headers }) })] })] }))] })) })] }));
}
