# PN-API Testing Guide

This document describes the testing framework for the PN-API project.

## Overview

The testing suite is organized into three main categories:

1. **API Tests** (`tests/test_api/`) - Test HTTP endpoints, authentication, and request/response handling
2. **Scanner Tests** (`tests/test_scanner/`) - Test scanner initialization, proxy sources, and checker logic (without network calls)
3. **CRUD Tests** (`tests/test_crud/`) - Test database operations with mocked MongoDB

## Setup

### 1. Install Testing Dependencies

```powershell
pip install -r requirements.txt
```

This installs:
- `pytest` - Test framework
- `pytest-asyncio` - Async test support
- `pytest-cov` - Code coverage reporting
- `mongomock` - MongoDB mocking
- `httpx` - HTTP client (used by FastAPI TestClient)

### 2. Environment Configuration

Tests use environment variables set in `tests/conftest.py`. For local development, create a `.env` file based on `.env.example`:

```powershell
cp .env.example .env
```

Then set your local values:

```bash
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your-dev-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
HOSTNAME=localhost
```

## Running Tests

### Run All Tests

```powershell
pytest
```

### Run with Verbose Output

```powershell
pytest -v
```

### Run Specific Test Categories

```powershell
# API tests only
pytest tests/test_api/ -v

# Scanner tests only
pytest tests/test_scanner/ -v

# CRUD tests only
pytest tests/test_crud/ -v
```

### Run Specific Test File

```powershell
pytest tests/test_api/test_proxies.py -v
```

### Run Specific Test Class or Method

```powershell
# Run single test class
pytest tests/test_api/test_proxies.py::TestProxiesEndpoints -v

# Run single test method
pytest tests/test_api/test_proxies.py::TestProxiesEndpoints::test_read_proxies_requires_authentication -v
```

### Generate Coverage Report

```powershell
# Generate coverage report
pytest --cov=app --cov-report=html tests/

# View the HTML report
start htmlcov/index.html
```

### Run Tests with Specific Markers

```powershell
# Run only API tests
pytest -m api

# Run only scanner tests
pytest -m scanner

# Run only CRUD tests
pytest -m crud

# Run all except integration tests
pytest -m "not integration"
```

## Test Structure

### Fixtures (conftest.py)

Fixtures are reusable test utilities defined in `tests/conftest.py`:

#### Authentication Fixtures
- **`test_token`** - Valid JWT token for testing
- **`auth_headers`** - Authorization header with valid token
- **`test_user_data`** - Sample user credentials

#### Database Fixtures
- **`mock_mongodb`** - Mocked MongoDB client (auto-used)
- **`mock_proxy_repo`** - Mocked ProxyRepo
- **`mock_user_repo`** - Mocked UserRepo
- **`mock_profile_repo`** - Mocked ProfileRepo

#### FastAPI Fixtures
- **`test_client`** - FastAPI TestClient with mocked Scanner
- **`test_settings`** - Configuration settings

#### Sample Data Fixtures
- **`sample_proxy_data`** - Sample proxy information
- **`sample_profile_data`** - Sample profile information
- **`sample_scanner_settings`** - Sample scanner configuration

### Example: Using Fixtures in Tests

```python
def test_example(test_client, auth_headers, mock_proxy_repo):
    """Test with fixtures."""
    # Fixtures are injected as parameters
    response = test_client.get('/proxies/', headers=auth_headers)
    assert response.status_code == 200
```

## API Tests (tests/test_api/)

Test HTTP endpoints and authentication.

### test_proxies.py
- Tests `/proxies/` endpoint with various filters
- Tests `/proxies/location_filter_values` endpoint
- Verifies query parameter handling
- Validates authentication requirements

### test_authentication.py
- Tests `/token` endpoint
- Tests JWT token validation
- Tests authorization header parsing
- Tests token expiration

**Key Points:**
- All API tests use `test_client` fixture
- All protected endpoints require `auth_headers`
- Mock database repositories to avoid real MongoDB calls
- Tests verify correct HTTP status codes and response formats

## Scanner Tests (tests/test_scanner/)

Test scanner initialization, proxy sources, and validation logic WITHOUT spawning threads or making network calls.

### test_scanner_core.py
- Tests Scanner singleton pattern
- Tests source initialization
- Tests thread creation
- Tests teardown/cleanup

### test_checker.py
- Tests proxy format validation
- Tests regex patterns for proxy URIs
- Tests initialization of test targets

### test_sources.py
- Tests that all proxy sources are registered
- Tests gather method contract
- Tests source attributes

### test_blacklist.py
- Tests blacklist initialization
- Tests IP matching logic
- Tests source file parsing

**Key Points:**
- Scanner tests are ISOLATED - they don't spawn actual threads
- Mocking is used to prevent network calls during tests
- Tests focus on logic, not external dependencies
- Use `@pytest.mark.scanner` for easy filtering

## CRUD Tests (tests/test_crud/)

Test database operations with mocked MongoDB.

### test_proxies.py
- Tests `get_alive_proxies()` with various filters
- Tests `get_filter_values()`
- Verifies database query construction
- Tests filtering logic (country, speed, reliability, etc.)

**Key Points:**
- Use mocked repository fixtures
- Verify correct MongoDB queries are constructed
- Test filtering logic independently
- Verify limits and sorting

## Important Design Patterns

### 1. Mocking MongoDB

MongoDB is mocked to prevent test dependencies on a running database:

```python
def test_example(mock_proxy_repo):
    mock_proxy_repo.find_by.return_value = []
    
    with patch('app.crud.proxies.proxies', mock_proxy_repo):
        # Test code here
```

### 2. Mocking Network Calls

Scanner tests use mocking to prevent network calls:

```python
with patch('app.scanner.sources.src_lists', []):
    # Scanner won't try to fetch proxies
```

### 3. Testing with Authentication

Use `auth_headers` fixture for protected endpoints:

```python
def test_protected_endpoint(test_client, auth_headers):
    response = test_client.get('/proxies/', headers=auth_headers)
    assert response.status_code == 200
```

### 4. Testing Error Cases

```python
def test_missing_auth(test_client):
    response = test_client.get('/proxies/')
    assert response.status_code == 403  # Forbidden
```

## Best Practices

### DO:
- ✅ Use fixtures for common setup
- ✅ Mock external dependencies (MongoDB, network)
- ✅ Use meaningful test names that describe what's being tested
- ✅ Group related tests in classes with `Test` prefix
- ✅ Mark tests with `@pytest.mark.api`, `@pytest.mark.scanner`, etc.
- ✅ Keep tests focused - one concept per test
- ✅ Use `patch()` to mock dependencies

### DON'T:
- ❌ Make real network calls in tests
- ❌ Depend on MongoDB running for unit tests
- ❌ Test multiple concepts in one test
- ❌ Use hardcoded values instead of fixtures
- ❌ Leave tests in "broken" state
- ❌ Create tight coupling between test and implementation

## Adding New Tests

### Template: API Test

```python
import pytest
from unittest.mock import patch

@pytest.mark.api
class TestNewFeature:
    """Test suite for new feature."""

    def test_new_endpoint(self, test_client, auth_headers):
        """Test the new endpoint."""
        response = test_client.get('/new-endpoint', headers=auth_headers)
        assert response.status_code == 200
```

### Template: Scanner Test

```python
import pytest
from unittest.mock import patch

@pytest.mark.scanner
class TestNewScannerFeature:
    """Test suite for new scanner feature."""

    def test_new_feature(self):
        """Test the new feature."""
        with patch('app.scanner.sources.src_lists', []):
            with patch('app.db.settings') as mock_settings:
                mock_settings.find_one_by.return_value = Mock(num_scan_threads=1)
                
                from app.scanner.scanner import Scanner
                # Test code here
```

### Template: CRUD Test

```python
import pytest
from unittest.mock import patch

@pytest.mark.crud
class TestNewCrudOperation:
    """Test suite for new CRUD operation."""

    def test_operation(self, mock_proxy_repo):
        """Test the operation."""
        mock_proxy_repo.find_by.return_value = []
        
        from app.crud.proxies import some_function
        
        with patch('app.crud.proxies.proxies', mock_proxy_repo):
            result = some_function()
            assert result == []
```

## Troubleshooting

### Tests not discovering
```powershell
# Verify pytest.ini is present and configured
pytest --collect-only
```

### Import errors
```powershell
# Ensure app is in Python path
# conftest.py adds it automatically, but verify:
$env:PYTHONPATH = "."
pytest
```

### Mock not working
- Verify you're patching where it's used, not where it's defined
- Use `patch('app.module.import_name', ...)` not the source location

### Scanner tests spawning threads
- Ensure you're using `patch()` for `Scanner.get_instance()`
- Ensure all threading is mocked out

## Next Steps

1. **Install dependencies**: `pip install -r requirements.txt`
2. **Set up environment**: Copy `.env.example` to `.env` and configure
3. **Run tests**: `pytest tests/ -v`
4. **Generate coverage**: `pytest --cov=app --cov-report=html tests/`
5. **Add more tests** as you develop new features

## References

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/advanced/testing/)
- [Unittest.mock Documentation](https://docs.python.org/3/library/unittest.mock.html)
- [Mongomock Documentation](https://docs.mongomock.org/)
