import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Container, Paper, TextInput, PasswordInput, Button, Stack, Center, Alert, Title, } from '@mantine/core';
import { login } from '../api/auth';
function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!password.trim()) {
            newErrors.password = 'Password is required';
        }
        else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        if (!validateForm()) {
            return;
        }
        setLoading(true);
        try {
            const response = await login(email, password);
            sessionStorage.setItem('access_token', response.access_token);
            onLoginSuccess();
        }
        catch (err) {
            setApiError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(Container, { size: 420, my: "xl", children: _jsx(Center, { children: _jsxs(Stack, { gap: "lg", w: "100%", children: [_jsx(Title, { order: 2, children: "PN-API Login" }), apiError && (_jsx(Alert, { color: "red", title: "Login Error", children: apiError })), _jsx(Paper, { p: "lg", radius: "md", withBorder: true, children: _jsx("form", { onSubmit: handleSubmit, children: _jsxs(Stack, { gap: "md", children: [_jsx(TextInput, { label: "Email", placeholder: "your@email.com", value: email, onChange: (e) => setEmail(e.currentTarget.value), error: errors.email, disabled: loading }), _jsx(PasswordInput, { label: "Password", placeholder: "Your password", value: password, onChange: (e) => setPassword(e.currentTarget.value), error: errors.password, disabled: loading }), _jsx(Button, { type: "submit", fullWidth: true, loading: loading, disabled: loading, children: loading ? 'Signing in...' : 'Sign in' })] }) }) })] }) }) }));
}
export default Login;
