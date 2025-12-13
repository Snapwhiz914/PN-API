"""
Pytest configuration and shared fixtures for PN-API tests.

Provides:
- FastAPI test client
- Mock MongoDB database
- Authentication fixtures
- Scanner test utilities
"""

import pytest
import os
import sys
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import jwt

# Add app to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set test environment variables before importing app modules
os.environ.setdefault('MONGODB_URI', 'mongodb://localhost:27017/test_pn')
os.environ.setdefault('JWT_SECRET', 'test-secret-key')
os.environ.setdefault('ACCESS_TOKEN_EXPIRE_MINUTES', '60')
os.environ.setdefault('HOSTNAME', 'localhost')


@pytest.fixture(scope="session")
def test_settings():
    """Provide test configuration settings."""
    from app.settings import MONGODB_URL, JWT_SECRET, ACCESS_TOKEN_EXPIRE_MINUTES, HOSTNAME
    return {
        'MONGODB_URL': MONGODB_URL,
        'JWT_SECRET': JWT_SECRET,
        'ACCESS_TOKEN_EXPIRE_MINUTES': ACCESS_TOKEN_EXPIRE_MINUTES,
        'HOSTNAME': HOSTNAME,
    }


@pytest.fixture(autouse=True)
def mock_mongodb(monkeypatch):
    """Mock MongoDB client to prevent tests from hitting real database.
    
    Auto-used for all tests unless explicitly disabled with:
    @pytest.mark.disable_auto_mock_mongodb
    """
    # Create mock database and collections
    mock_db = MagicMock()
    mock_collection = MagicMock()
    
    mock_db.__getitem__.return_value = mock_collection
    
    # Mock PyMongo MongoClient
    with patch('pymongo.MongoClient') as mock_client:
        mock_client.return_value.__getitem__.return_value = mock_db
        yield mock_db


@pytest.fixture
def test_user_data():
    """Provide sample user data for testing."""
    return {
        'email': 'test@example.com',
        'password': 'test_password_123',
    }


@pytest.fixture
def test_token(test_settings):
    """Generate a valid JWT token for testing."""
    payload = {
        'sub': 'test@example.com',
        'exp': datetime.now() + timedelta(minutes=60),
        'iat': datetime.now(),
    }
    token = jwt.encode(payload, test_settings['JWT_SECRET'], algorithm='HS256')
    return token


@pytest.fixture
def auth_headers(test_token):
    """Provide authorization headers with valid JWT token."""
    return {'Authorization': f'Bearer {test_token}'}


@pytest.fixture
def test_client(mock_mongodb):
    """Provide FastAPI test client with mocked dependencies.
    
    Note: This fixture auto-uses mock_mongodb to ensure no real database calls.
    """
    from app.main import app
    
    # Patch Scanner to prevent thread spawning during tests
    with patch('app.main.Scanner') as mock_scanner:
        mock_scanner_instance = MagicMock()
        mock_scanner.get_instance.return_value = mock_scanner_instance
        
        client = TestClient(app)
        yield client


@pytest.fixture
def sample_proxy_data():
    """Provide sample proxy data for testing."""
    return {
        'uri': 'http://192.168.1.1:8080',
        'country': 'US',
        'region': 'California',
        'city': 'San Francisco',
        'anon': 3,  # high anonymity (see app/models/proxy.py Anonymity enum)
        'protocol': 0,  # HTTP
        'speed': 1500,
        'reliability': 0.95,
        'last_check': datetime.now(),
        'last_check_status': True,
        'accessible_websites': ['google.com', 'reddit.com'],
    }


@pytest.fixture
def sample_profile_data():
    """Provide sample profile data for testing."""
    return {
        'name': 'Test Profile',
        'description': 'A test profile',
        'user_email': 'test@example.com',
        'proxies': ['http://192.168.1.1:8080'],
        'pac_settings': {
            'protocol': 'SOCKS5',
            'rotation_strategy': 'round_robin',
        },
        'created_at': datetime.now(),
        'updated_at': datetime.now(),
    }


@pytest.fixture
def sample_scanner_settings():
    """Provide sample scanner settings for testing."""
    return {
        'num_scan_threads': 4,
        'num_check_threads': 8,
        'alive_check_interval_minutes': 15,
        'dead_check_interval_minutes': 60,
        'enabled_sources': ['hidemy', 'pubproxy', 'txt_lists'],
    }


@pytest.fixture
def mock_proxy_repo(monkeypatch):
    """Provide a mocked ProxyRepo for unit tests."""
    from app.models.proxy import ProxyRepo
    
    mock_repo = MagicMock(spec=ProxyRepo)
    mock_repo.find_by.return_value = []
    mock_repo.find_one_by.return_value = None
    mock_repo.save.return_value = None
    mock_repo.delete.return_value = None
    
    # Patch the repository in the database module
    monkeypatch.setattr('app.db.proxies', mock_repo)
    return mock_repo


@pytest.fixture
def mock_user_repo(monkeypatch):
    """Provide a mocked UserRepo for unit tests."""
    from app.models.user import UserRepo
    
    mock_repo = MagicMock(spec=UserRepo)
    mock_repo.find_by.return_value = []
    mock_repo.find_one_by.return_value = None
    mock_repo.save.return_value = None
    
    monkeypatch.setattr('app.db.users', mock_repo)
    return mock_repo


@pytest.fixture
def mock_profile_repo(monkeypatch):
    """Provide a mocked ProfileRepo for unit tests."""
    from app.models.profile import ProfileRepo
    
    mock_repo = MagicMock(spec=ProfileRepo)
    mock_repo.find_by.return_value = []
    mock_repo.find_one_by.return_value = None
    mock_repo.save.return_value = None
    
    monkeypatch.setattr('app.db.profiles', mock_repo)
    return mock_repo


@pytest.fixture(autouse=True)
def mock_scanner_settings_repo(monkeypatch):
    """Mock ScannerSettingsRepo to return default ScannerSettings for all tests.
    
    Auto-used for all tests to ensure settings.find_one_by() returns a workable
    ScannerSettings object with all default values instead of hitting MongoDB.
    """
    from app.models.scanner import ScannerSettings, ScannerSettingsRepo
    
    # Create a real ScannerSettings instance with all defaults
    default_settings = ScannerSettings()
    
    # Create a mock repo that returns the default settings
    mock_repo = MagicMock(spec=ScannerSettingsRepo)
    mock_repo.find_one_by.return_value = default_settings
    mock_repo.save.return_value = None
    
    # Patch it in the db module
    monkeypatch.setattr('app.db.settings', mock_repo)
    return mock_repo

