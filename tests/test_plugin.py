from unittest.mock import ANY

from amazon_codeguru_jupyterlab_extension import plugin
from tests.conftest import *

def test_settings():
    result = plugin.pylsp_settings()
    expected = {
        "plugins": {}
    }
    assert result == expected

