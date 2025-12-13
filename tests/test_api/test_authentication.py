"""Tests for authentication endpoints and JWT token handling."""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import jwt


@pytest.mark.api
class TestAuthentication:
    """Test suite for authentication functionality."""

    def test_token_endpoint_requires_credentials(self, test_client):
        """Test that token endpoint requires email and password."""
        response = test_client.post('/token', data={})
        assert response.status_code == 422  # Unprocessable Entity

    def test_token_endpoint_with_valid_credentials(self, test_client, mock_user_repo, test_settings):
        """Test token generation with valid credentials."""
        # Create a mock user with hashed password
        mock_user = MagicMock()
        mock_user.email = 'test@example.com'
        mock_user.password = '$2b$12$mock_hashed_password'  # Mock bcrypt hash
        
        mock_user_repo.find_one_by.return_value = mock_user
        
        with patch('app.routers.users.users', mock_user_repo):
            with patch('app.crud.users.pwd_context.verify', return_value=True):
                response = test_client.post(
                    '/token',
                    data={'username': 'test@example.com', 'password': 'test_password'}
                )
                assert response.status_code == 200
                data = response.json()
                assert 'access_token' in data
                assert data['token_type'] == 'bearer'

    def test_token_endpoint_with_invalid_credentials(self, test_client, mock_user_repo):
        """Test token generation with invalid credentials."""
        mock_user_repo.find_one_by.return_value = None
        
        with patch('app.routers.users.users', mock_user_repo):
            response = test_client.post(
                '/token',
                data={'username': 'nonexistent@example.com', 'password': 'wrong_password'}
            )
            assert response.status_code == 401

    def test_valid_token_provides_access(self, test_client, auth_headers, mock_proxy_repo):
        """Test that valid token provides access to protected endpoints."""
        mock_proxy_repo.find_by.return_value = []
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            response = test_client.get('/proxies/', headers=auth_headers)
            assert response.status_code == 200

    def test_invalid_token_denied_access(self, test_client):
        """Test that invalid token is rejected."""
        headers = {'Authorization': 'Bearer invalid.token.here'}
        response = test_client.get('/proxies/', headers=headers)
        assert response.status_code == 403

    def test_expired_token_denied_access(self, test_client, test_settings):
        """Test that expired token is rejected."""
        # Create an expired token
        payload = {
            'sub': 'test@example.com',
            'exp': datetime.now() - timedelta(hours=1),  # Expired
            'iat': datetime.now() - timedelta(hours=2),
        }
        expired_token = jwt.encode(payload, test_settings['JWT_SECRET'], algorithm='HS256')
        
        headers = {'Authorization': f'Bearer {expired_token}'}
        response = test_client.get('/proxies/', headers=headers)
        assert response.status_code == 403

    def test_missing_authorization_header(self, test_client):
        """Test that missing authorization header is rejected."""
        response = test_client.get('/proxies/')
        assert response.status_code == 403

    def test_malformed_authorization_header(self, test_client):
        """Test that malformed authorization header is rejected."""
        headers = {'Authorization': 'NotBearer token'}
        response = test_client.get('/proxies/', headers=headers)
        assert response.status_code == 403
