import os
from unittest import mock
from botocore.stub import Stubber

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
    result = diagnostics.get_message_for_finding(
        finding, fixtures_dir / "converted.py", True)
    expected = {
        "code": "python/improper-error-handling@v1.0",
        "message": "Issue: Improper error handling\n\nSuggested remediation: Try, Except, Pass detected. https://bandit.readthedocs.io/en/latest/plugins/b110_try_except_pass.html",
        "range": {
            "end": {"character": 22, "line": 26},
            "start": {"character": 4, "line": 26}
        },
        "severity": 2,
        "source": "codeguru-security"
    }
    assert result == expected


def test_flatten():
    result = diagnostics.flatten([[1, 2, 3], [4], [5, 6]])
    expected = [1, 2, 3, 4, 5, 6]
    assert result == expected


def test_create_python_from_notebook(workspace):
    document = create_document(workspace, "simple.ipynb")
    result = diagnostics.create_python_from_notebook(document.path)
    expected_path = "/tmp/simple.py"
    with open(expected_path) as f:
        lines = f.readlines()
    assert lines == [
        "def __CELL_EDGE__(x):\n",
        "\tpass\n",
        "__CELL_EDGE__(0)\n",
        "import sys\n",
        "def main():\n",
        "    print(sys.stdin.read())\n"
    ]
    assert result == expected_path


def test_create_zip_from_python(workspace):
    document = create_document(workspace, "simple.py")
    result = diagnostics.create_zip_from_python(document.path)
    expected_path = "/tmp/simple.zip"
    assert os.path.isfile(expected_path)
    assert result == expected_path


def test_get_diagnostics_from_other_sources(config, workspace, document):
    mock_hook_handlers = Mock(return_value=[[{"message": "other"}]])
    config.plugin_manager.subset_hook_caller = Mock(
        return_value=mock_hook_handlers)
    result = diagnostics.get_diagnostics_from_other_sources(
        config, workspace, document)
    expected = [{"message": "other"}]
    assert result == expected


def test_create_scan():
    client = diagnostics.get_codeguru_security_client("us-west-2")
    create_scan_response = {
        "runId": "123",
        "scanName": "jl-scan-name",
        "resourceId": {"codeArtifactId": "code-artifact-id"},
        "scanState": "Pending"
    }
    expected_params = {
        "resourceId": {"codeArtifactId": "code-artifact-id"},
        "scanName": "jl-scan-name",
        "scanType": "Express",
        "analysisType": "All"
    }
    with Stubber(client) as stubber:
        stubber.add_response(
            "create_scan", create_scan_response, expected_params)
        send_notification = Mock()
        result = diagnostics.create_scan(
            "code-artifact-id", "jl-scan-name", client, send_notification)
        assert result == "123"


def test_create_scan_failed():
    client = diagnostics.get_codeguru_security_client("us-west-2")
    with Stubber(client) as stubber:
        stubber.add_client_error(
            "create_scan", service_error_code="foo", service_message="bar")
        send_notification = Mock()
        diagnostics.create_scan(
            "code-artifact-id", "jl-scan-name", client, send_notification)
        send_notification.assert_called_once_with({
            "message": "An error occurred (foo) when calling the CreateScan operation: bar",
            "status": "error",
        })


@mock.patch('requests.put')
def test_upload_file(mock_put):
    client = diagnostics.get_codeguru_security_client("us-west-2")
    create_upload_url_response = {
        "s3Url": "https://s3-url.com",
        "requestHeaders": {"a": "b", "c": "d"},
        "codeArtifactId": "code-artifact-id"
    }
    create_upload_url_expected_params = {
        "scanName": "jl-scan-name"
    }
    with Stubber(client) as stubber:
        stubber.add_response(
            "create_upload_url", create_upload_url_response, create_upload_url_expected_params)
        send_notification = Mock()
        result = diagnostics.upload_file(
            "/tmp/simple.zip", "jl-scan-name", client, send_notification)
        mock_put.assert_called_once_with(
            "https://s3-url.com", data=mock.ANY, headers={"a": "b", "c": "d"})
        assert result == "code-artifact-id"


def test_upload_file_create_upload_url_failed():
    client = diagnostics.get_codeguru_security_client("us-west-2")
    with Stubber(client) as stubber:
        stubber.add_client_error(
            "create_upload_url", service_error_code="foo", service_message="bar")
        send_notification = Mock()
        diagnostics.upload_file(
            "/tmp/simple.zip", "jl-scan-name", client, send_notification)
        send_notification.assert_called_once_with({
            "message": "An error occurred (foo) when calling the CreateUploadUrl operation: bar",
            "status": "error",
        })


@mock.patch('requests.put')
def test_upload_file_failed(mock_put):
    client = diagnostics.get_codeguru_security_client("us-west-2")
    create_upload_url_response = {
        "s3Url": "https://s3-url.com",
        "requestHeaders": {"a": "b", "c": "d"},
        "codeArtifactId": "code-artifact-id"
    }
    with Stubber(client) as stubber:
        stubber.add_response("create_upload_url", create_upload_url_response)
        send_notification = Mock()
        mock_put.return_value.ok = False
        diagnostics.upload_file(
            "/tmp/simple.zip", "jl-scan-name", client, send_notification)
        mock_put.assert_called_once_with(
            "https://s3-url.com", data=mock.ANY, headers={"a": "b", "c": "d"})
        send_notification.assert_called_once_with({
            "message": "File upload failed",
            "status": "error",
        })


def test_get_scan_findings(finding):
    client = diagnostics.get_codeguru_security_client("us-west-2")
    get_findings_response = {
        "findings": [finding]
    }
    get_findings_expected_params = {
        "scanName": "jl-scan-name"
    }
    with Stubber(client) as stubber:
        stubber.add_response(
            "get_findings", get_findings_response, get_findings_expected_params)
        send_notification = Mock()
        result = diagnostics.get_scan_findings(
            "jl-scan-name", client, send_notification)
        send_notification.assert_called_once_with({
            "message": 1,
            "status": "completed"
        })
        assert result == [finding]


def test_get_scan_findings_failed():
    client = diagnostics.get_codeguru_security_client("us-west-2")
    with Stubber(client) as stubber:
        stubber.add_client_error(
            "get_findings", service_error_code="foo", service_message="bar")
        send_notification = Mock()
        diagnostics.get_scan_findings(
            "jl-scan-name", client, send_notification)
        send_notification.assert_called_once_with({
            "message": "An error occurred (foo) when calling the GetFindings operation: bar",
            "status": "error"
        })


def test_poll_scan_status_succeeded():
    client = diagnostics.get_codeguru_security_client("us-west-2")
    get_scan_response = {
        "scanState": "Successful",
        "scanName": "jl-scan-name",
        "runId": "run-id",
        "createdAt": 1,
        "analysisType": "All"
    }
    get_scan_expected_params = {
        "scanName": "jl-scan-name",
        "runId": "run-id"
    }
    with Stubber(client) as stubber:
        stubber.add_response("get_scan", get_scan_response,
                             get_scan_expected_params)
        send_notification = Mock()
        diagnostics.poll_scan_status(
            "jl-scan-name", "run-id", client, send_notification)
        send_notification.assert_not_called()


def test_poll_scan_status_failed():
    client = diagnostics.get_codeguru_security_client("us-west-2")
    get_scan_response = {
        "scanState": "Failed",
        "scanName": "jl-scan-name",
        "runId": "run-id",
        "createdAt": 1,
        "analysisType": "All"
    }
    get_scan_expected_params = {
        "scanName": "jl-scan-name",
        "runId": "run-id"
    }
    with Stubber(client) as stubber:
        stubber.add_response("get_scan", get_scan_response,
                             get_scan_expected_params)
        send_notification = Mock()
        diagnostics.poll_scan_status(
            "jl-scan-name", "run-id", client, send_notification)
        send_notification.assert_called_once_with({
            "message": "Scan failed",
            "status": "error"
        })


def test_poll_scan_status_get_scan_failed():
    client = diagnostics.get_codeguru_security_client("us-west-2")
    with Stubber(client) as stubber:
        stubber.add_client_error(
            "get_scan", service_error_code="foo", service_message="bar")
        send_notification = Mock()
        diagnostics.poll_scan_status(
            "scan_name", "run-id", client, send_notification)
        send_notification.assert_called_once_with({
            "message": "An error occurred (foo) when calling the GetScan operation: bar",
            "status": "error"
        })


def test_get_message_for_finding_nb():
    finding = {
        "detectorId": "python/foo@v1.0",
        "detectorName": "Foo",
        "remediation": {
            "recommendation": {
                "text": "Bar"
            }
        },
        "severity": "Low",
        "vulnerability": {
            "filePath": {
                "startLine": 4,
                "endLine": 4
            }
        }
    }
    result = diagnostics.get_message_for_finding(
        finding, "/tmp/simple.py", True)
    assert result == {
        "source": "codeguru-security",
        "code": "python/foo@v1.0",
        "message": "Issue: Foo\n\nSuggested remediation: Bar",
        "range": {
            "start": {"line": 0, "character": 0},
            "end": {"line": 0, "character": 11}
        },
        "severity": 2
    }


def test_get_message_for_finding_python():
    finding = {
        "detectorId": "python/foo@v1.0",
        "detectorName": "Foo",
        "remediation": {
            "recommendation": {
                "text": "Bar"
            }
        },
        "severity": "Low",
        "vulnerability": {
            "filePath": {
                "startLine": 4,
                "endLine": 4
            }
        }
    }
    result = diagnostics.get_message_for_finding(
        finding, "/tmp/simple.py", False)
    assert result == {
        "source": "codeguru-security",
        "code": "python/foo@v1.0",
        "message": "Issue: Foo\n\nSuggested remediation: Bar",
        "range": {
            "start": {"line": 3, "character": 0},
            "end": {"line": 3, "character": 11}
        },
        "severity": 2
    }
