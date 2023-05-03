import json
from unittest.mock import ANY

from amazon_codeguru_jupyterlab_extension import diagnostics
from tests.conftest import *


def test_get_cell_md():
    result = diagnostics.get_cell_md(fixtures_dir / "converted.py")
    expected = [
        [0, 21, 55, 34, -21],
        [1, 57, 87, 64, -20],
        [2, 4, 19, 79, 66],
        [3, 89, 90, 80, -1]
    ]
    assert result == expected


def test_get_message_for_finding_for_nb(finding):
    result = diagnostics.get_message_for_finding(finding, fixtures_dir / "converted.py", True)
    expected = {
        "code": "python/improper-error-handling@v1.0",
        "message": "Issue: Improper error handling\n\nSuggested remediation: Try, Except, Pass detected. https://bandit.readthedocs.io/en/latest/plugins/b110_try_except_pass.html",
        "range": {
            "end": { "character": 22, "line": 26 },
            "start": { "character": 4, "line": 26 }
        },
        "severity": 2,
        "source": "codeguru-security"
    }
    assert result == expected


def test_flatten():
    result = diagnostics.flatten([[1, 2, 3], [4], [5, 6]])
    expected = [1, 2, 3, 4, 5, 6]
    assert result == expected

