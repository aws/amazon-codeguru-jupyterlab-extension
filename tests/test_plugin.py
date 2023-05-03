from unittest.mock import ANY

from amazon_codeguru_jupyterlab_extension import plugin
from tests.conftest import *

def test_settings():
    result = plugin.pylsp_settings()
    expected = {
        "plugins": {}
    }
    assert result == expected


def test_lint(config, workspace, document):
    result = plugin.pylsp_lint(config, workspace, document, False)
    expected = None
    assert result == expected

