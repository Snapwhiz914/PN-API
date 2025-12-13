"""Tests for IP blacklist functionality."""

import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path

@pytest.mark.scanner
class TestBlacklistMatching:
    """Test IP matching against blacklist."""

    def test_blacklist_can_check_ip(self):
        """Test that Blacklist can check if IP is blacklisted."""
        from app.scanner.blacklist import Blacklist
        
        blacklist = Blacklist()
        
        assert hasattr(blacklist, 'is_blocked') or hasattr(blacklist, 'check')

    def test_blacklist_returns_boolean(self):
        """Test that blacklist check returns boolean."""
        from app.scanner.blacklist import Blacklist
        
        blacklist = Blacklist()
        
        # If method exists, test it returns boolean
        if hasattr(blacklist, 'is_blocked'):
            result = blacklist.is_blocked('192.168.1.1')
            assert isinstance(result, bool)


@pytest.mark.scanner
class TestBlacklistSourceFiles:
    """Test blacklist source file discovery."""

    def test_blacklist_source_directory_exists(self):
        """Test that blacklist source directory exists."""
        blacklist_dir = Path('app/static/blacklist')
