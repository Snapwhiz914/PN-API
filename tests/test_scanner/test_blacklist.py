"""Tests for IP blacklist functionality."""

import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path

@pytest.mark.scanner
class TestBlacklist:
    """Test IP matching against blacklist."""

    def test_blacklist_initialization_teardown(self):
        from app.scanner.blacklist import Blacklist

        blacklist = Blacklist()
        blacklist.update_thread_kill = True
        blacklist.update_thread.join(1)
        assert blacklist.update_thread.is_alive() == False

    def test_blacklist_can_check_ip(self):
        """Test that Blacklist can check if IP is blacklisted."""
        from app.scanner.blacklist import Blacklist
        
        blacklist = Blacklist()
        result = blacklist.is_blacklisted(uri="socks4://36.116.0.10:6969")
        assert result == True
