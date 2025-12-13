"""Tests for proxy CRUD operations."""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from app.models.proxy import Proxy, Anonymity
from app.schemas.proxies import FilterProxies


@pytest.mark.crud
class TestGetAliveProxies:
    """Test filtering alive proxies."""

    def test_get_alive_proxies_no_filters(self, mock_proxy_repo, sample_proxy_data):
        """Test retrieving all alive proxies without filters."""
        proxy = Proxy(**sample_proxy_data)
        mock_proxy_repo.find_by.return_value = [proxy]
        
        from app.crud.proxies import get_alive_proxies
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            filter_obj = FilterProxies()
            result = get_alive_proxies(filter_obj)
            
            assert len(result) == 1
            assert result[0].uri == sample_proxy_data['uri']

    def test_get_alive_proxies_filters_by_country(self, mock_proxy_repo, sample_proxy_data):
        """Test filtering proxies by country."""
        mock_proxy_repo.find_by.return_value = []
        
        from app.crud.proxies import get_alive_proxies
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            filter_obj = FilterProxies(countries=['US'])
            result = get_alive_proxies(filter_obj)
            
            # Verify the filter was applied
            assert mock_proxy_repo.find_by.called
            call_args = mock_proxy_repo.find_by.call_args
            assert 'location.country' in call_args[0][0]

    def test_get_alive_proxies_filters_by_speed(self, mock_proxy_repo):
        """Test filtering proxies by speed (max latency)."""
        mock_proxy_repo.find_by.return_value = []
        
        from app.crud.proxies import get_alive_proxies
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            filter_obj = FilterProxies(speed=2000)  # Max 2000ms
            result = get_alive_proxies(filter_obj)
            
            assert mock_proxy_repo.find_by.called
            call_args = mock_proxy_repo.find_by.call_args
            assert 'speed' in call_args[0][0]

    def test_get_alive_proxies_filters_by_reliability(self, mock_proxy_repo):
        """Test filtering proxies by minimum reliability."""
        mock_proxy_repo.find_by.return_value = []
        
        from app.crud.proxies import get_alive_proxies
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            filter_obj = FilterProxies(reliability=0.90)
            result = get_alive_proxies(filter_obj)
            
            assert mock_proxy_repo.find_by.called
            call_args = mock_proxy_repo.find_by.call_args
            assert 'reliability' in call_args[0][0]

    def test_get_alive_proxies_filters_by_anonymity(self, mock_proxy_repo):
        """Test filtering proxies by anonymity level."""
        mock_proxy_repo.find_by.return_value = []
        
        from app.crud.proxies import get_alive_proxies
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            filter_obj = FilterProxies(anons=[Anonymity.high])  # see app/models/proxy.py
            result = get_alive_proxies(filter_obj)
            
            assert mock_proxy_repo.find_by.called

    def test_get_alive_proxies_filters_by_protocol(self, mock_proxy_repo):
        """Test filtering proxies by protocol."""
        mock_proxy_repo.find_by.return_value = []
        
        from app.crud.proxies import get_alive_proxies
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            filter_obj = FilterProxies(protocs=[0, 1])  # HTTP and HTTPS
            result = get_alive_proxies(filter_obj)
            
            assert mock_proxy_repo.find_by.called

    def test_get_alive_proxies_filters_by_last_check_time(self, mock_proxy_repo):
        """Test filtering proxies by last check time."""
        mock_proxy_repo.find_by.return_value = []
        
        from app.crud.proxies import get_alive_proxies
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            filter_obj = FilterProxies(last_check=15)  # Checked in last 15 minutes
            result = get_alive_proxies(filter_obj)
            
            assert mock_proxy_repo.find_by.called
            call_args = mock_proxy_repo.find_by.call_args
            assert 'last_check' in call_args[0][0]

    def test_get_alive_proxies_filters_by_accessible_websites(self, mock_proxy_repo):
        """Test filtering proxies by accessible websites."""
        mock_proxy_repo.find_by.return_value = []
        
        from app.crud.proxies import get_alive_proxies
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            filter_obj = FilterProxies(accessible_websites=['google.com', 'reddit.com'])
            result = get_alive_proxies(filter_obj)
            
            assert mock_proxy_repo.find_by.called

    def test_get_alive_proxies_only_returns_alive(self, mock_proxy_repo):
        """Test that only alive proxies (last_check_status=True) are returned."""
        mock_proxy_repo.find_by.return_value = []
        
        from app.crud.proxies import get_alive_proxies
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            filter_obj = FilterProxies()
            result = get_alive_proxies(filter_obj)
            
            assert mock_proxy_repo.find_by.called
            call_args = mock_proxy_repo.find_by.call_args
            # Verify last_check_status filter is always applied
            assert 'last_check_status' in call_args[0][0]
            assert call_args[0][0]['last_check_status'] is True


@pytest.mark.crud
class TestGetFilterValues:
    """Test retrieval of filter value options."""

    def test_get_filter_values_returns_countries(self, mock_proxy_repo):
        """Test that filter values include available countries."""
        mock_collection = MagicMock()
        mock_collection.distinct.side_effect = [
            ['US', 'UK', 'CA'],  # countries
            [],  # cities
            [],  # regions
        ]
        mock_proxy_repo.get_collection.return_value = mock_collection
        
        from app.crud.proxies import get_filter_values
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            countries, cities, regions = get_filter_values()
            
            assert 'US' in countries
            assert 'UK' in countries

    def test_get_filter_values_returns_cities(self, mock_proxy_repo):
        """Test that filter values include available cities."""
        mock_collection = MagicMock()
        mock_collection.distinct.side_effect = [
            [],  # countries
            ['San Francisco', 'London'],  # cities
            [],  # regions
        ]
        mock_proxy_repo.get_collection.return_value = mock_collection
        
        from app.crud.proxies import get_filter_values
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            countries, cities, regions = get_filter_values()
            
            assert 'San Francisco' in cities
            assert 'London' in cities

    def test_get_filter_values_returns_regions(self, mock_proxy_repo):
        """Test that filter values include available regions."""
        mock_collection = MagicMock()
        mock_collection.distinct.side_effect = [
            [],  # countries
            [],  # cities
            ['California', 'England'],  # regions
        ]
        mock_proxy_repo.get_collection.return_value = mock_collection
        
        from app.crud.proxies import get_filter_values
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            countries, cities, regions = get_filter_values()
            
            assert 'California' in regions
            assert 'England' in regions
