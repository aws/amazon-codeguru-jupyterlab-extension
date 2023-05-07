from unittest.mock import ANY

from amazon_codeguru_jupyterlab_extension import plugin
from tests.conftest import *

def test_settings():
    result = plugin.pylsp_settings()
    expected = {
        "plugins": {}
    }
    assert result == expected


def test_lint_with_existing_diagnostics(config, workspace, document):
    diagnostics = [{
        "source": "foo",
        "code": "bar",
        "message": "baz"
    }]
    plugin.cfg.diagnostics_by_document = {
        document.uri: diagnostics
    }
    result = plugin.pylsp_lint(config, workspace, document, False)
    expected = diagnostics
    assert result == expected


def test_lint_without_existing_diagnostics(config, workspace, document):
    plugin.cfg.diagnostics_by_document = {}
    result = plugin.pylsp_lint(config, workspace, document, False)
    expected = None
    assert result == expected


def test_execute_run_scan(config, workspace, document):
    plugin.get_diagnostics_from_other_sources = Mock(return_value=[{"message": "1"}])
    plugin.get_diagnostics = Mock(return_value=[{"message": "2"}])
    plugin.Workspace.publish_diagnostics = Mock()
    plugin.execute_run_scan(config, workspace, document, "region")
    plugin.get_diagnostics_from_other_sources.assert_called_once_with(config, workspace, document)
    plugin.get_diagnostics.assert_called_once_with(workspace, document, "region")
    plugin.Workspace.publish_diagnostics.assert_called_once_with(doc_uri=document.uri, diagnostics=[{"message": "1"}, {"message": "2"}])


def test_execute_command_run_scan(config, workspace, document):
    plugin.execute_run_scan = Mock()
    workspace.get_document = Mock(return_value=document)
    plugin.pylsp_execute_command(config, workspace, "cgs.runScan", [document.uri, "region"])
    plugin.execute_run_scan.assert_called_once_with(config, workspace, document, "region")


def test_execute_command_other(config, workspace):
    plugin.execute_run_scan = Mock()
    plugin.pylsp_execute_command(config, workspace, "some-cmd", ["some", "args"])
    assert not plugin.execute_run_scan.called
