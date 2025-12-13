"""Tests for the Checker proxy validation functionality."""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime


@pytest.mark.scanner
class TestCheckerInitialization:
    """Test Checker initialization."""

    def test_checker_initializes_test_targets(self):
        """Test that Checker initializes with test targets."""
        from app.scanner.checker import Checker
        
        checker = Checker()
        
        assert hasattr(checker, 'test_targets')
        assert len(checker.test_targets) > 0

    def test_checker_initializes_statistics(self):
        """Test that Checker initializes statistics tracking."""
        from app.scanner.checker import Checker
        
        checker = Checker()
        
        assert hasattr(checker, 'statistics')
