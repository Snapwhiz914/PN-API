"""Tests for proxies API endpoints."""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime
from app.models.proxy import Proxy, Anonymity


@pytest.mark.api
class TestProxiesEndpoints:
    """Test suite for /proxies API endpoints."""

    def test_read_proxies_requires_authentication(self, test_client):
        """Test that proxies endpoint requires JWT token."""
        response = test_client.get('/proxies/')
        assert response.status_code == 403

    def test_read_proxies_with_valid_token(self, test_client, auth_headers, mock_proxy_repo):
        """Test that proxies endpoint accepts valid JWT token."""
        # Mock the get_alive_proxies function to return empty list
        mock_proxy_repo.find_by.return_value = []
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            response = test_client.get('/proxies/', headers=auth_headers)
            assert response.status_code == 200
            assert response.json() == []

    def test_read_proxies_with_filters(self, test_client, auth_headers, sample_proxy_data, mock_proxy_repo):
        """Test proxies endpoint with query filters."""
        # Create a mock proxy object
        proxy = Proxy(**sample_proxy_data)
        mock_proxy_repo.find_by.return_value = [proxy]
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            response = test_client.get(
                '/proxies/?countries=US&speed=2000&limit=10',
                headers=auth_headers
            )
            assert response.status_code == 200
            # Verify that find_by was called with appropriate filters
            mock_proxy_repo.find_by.assert_called()

    def test_read_proxies_with_country_filter(self, test_client, auth_headers, mock_proxy_repo):
        """Test proxies endpoint with country filter."""
        mock_proxy_repo.find_by.return_value = []
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            response = test_client.get(
                '/proxies/?countries=US&countries=UK',
                headers=auth_headers
            )
            assert response.status_code == 200

    def test_read_proxies_with_anonymity_filter(self, test_client, auth_headers, mock_proxy_repo):
        """Test proxies endpoint with anonymity filter."""
        mock_proxy_repo.find_by.return_value = []
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            response = test_client.get(
                '/proxies/?anons=3',  # high anonymity (see app/models/proxy.py)
                headers=auth_headers
            )
            assert response.status_code == 200

    def test_read_proxies_with_protocol_filter(self, test_client, auth_headers, mock_proxy_repo):
        """Test proxies endpoint with protocol filter."""
        mock_proxy_repo.find_by.return_value = []
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            response = test_client.get(
                '/proxies/?protocs=0&protocs=1',  # HTTP and HTTPS
                headers=auth_headers
            )
            assert response.status_code == 200
