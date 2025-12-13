"""Tests for proxy source implementations."""

import pytest
from unittest.mock import MagicMock, patch


@pytest.mark.scanner
class TestSourcesInitialization:
    """Test that all proxy sources are properly initialized."""

    def test_sources_are_registered(self):
        """Test that all proxy sources are registered."""
        from app.scanner.sources import src_lists
        
        assert len(src_lists) > 0

    def test_all_sources_have_gather_method(self):
        """Test that all registered sources have gather method."""
        from app.scanner.sources import src_lists
        
        for source_class in src_lists:
            # Create instance with minimal required args
            source = source_class(usable_proxies=[])
            assert hasattr(source, 'gather')
            assert callable(source.gather)
