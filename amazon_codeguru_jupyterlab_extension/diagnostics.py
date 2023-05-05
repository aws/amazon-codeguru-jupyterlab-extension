from datetime import datetime
from enum import Enum
import logging
from functools import partial
import os
import re
import threading
import zipfile
import requests
from botocore.exceptions import ClientError
from pylsp import lsp
from pylsp.config.config import Config
from pylsp.workspace import Workspace, Document

from .constants import PLUGIN_NAME
from .codeguru import get_codeguru_security_client
from .parseNotebookIntoScript import run

logger = logging.getLogger(__name__)
TMP_DIR = "/tmp"


class CommandStatus(str, Enum):
    PENDING = "pending"
    ERROR = "error"
    COMPLETED = "completed"


def create_python_from_notebook(nb_filepath: str):
    py_filepath = os.path.join(TMP_DIR, nb_filepath.replace(".ipynb", ".py"))
    run(nb_filepath, py_filepath)
    return py_filepath


def create_zip_from_python(py_filepath: str):
    zip_filepath = os.path.join(TMP_DIR, py_filepath.replace(".py", ".zip"))
    with zipfile.ZipFile(zip_filepath, "w", zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(py_filepath, arcname=os.path.basename(py_filepath))
    return zip_filepath


def upload_file(zip_filepath: str, scan_name: str, codeguru_security, send_notification):
    try:
        create_upload_url_response = codeguru_security.create_upload_url(
            fileName=os.path.basename(zip_filepath), scanName=scan_name)
    except ClientError as e:
        logger.error(e)
        send_notification({"status": CommandStatus.ERROR, "message": str(e)})
        return
    s3_url = create_upload_url_response['s3Url']
    request_headers = create_upload_url_response['requestHeaders']
    code_artifact_id = create_upload_url_response['codeArtifactId']

    with open(zip_filepath, "rb") as f:
        put_response = requests.put(s3_url, data=f, headers=request_headers)
        if not put_response.ok:
            logger.error("Upload failed")
            send_notification({"status": CommandStatus.ERROR,
                              "message": "File upload failed"})
            return

    return code_artifact_id


def create_scan(code_artifact_id: str, scan_name: str, codeguru_security, send_notification):
    try:
        create_scan_response = codeguru_security.create_scan(resourceId={"codeArtifactId": code_artifact_id},
                                                             scanName=scan_name,
                                                             scanType="Express")
    except ClientError as e:
        logger.error(e)
        send_notification({"status": CommandStatus.ERROR, "message": str(e)})
        return
    run_id = create_scan_response['runId']
    return run_id


def poll_scan_status(scan_name: str, run_id: str, codeguru_security, send_notification):
    e = threading.Event()
    while not e.wait(5):
        try:
            get_scan_response = codeguru_security.get_scan(
                scanName=scan_name, runId=run_id)
        except ClientError as e:
            logger.error(e)
            send_notification(
                {"status": CommandStatus.ERROR, "message": str(e)})
            return
        if get_scan_response['scanState'] == 'Successful':
            break
        elif get_scan_response['scanState'] == 'Failed':
            logger.error("Express scan failed")
            send_notification({"status": CommandStatus.ERROR, "message": "Scan failed"})
            return


def get_scan_findings(scan_name: str, codeguru_security, send_notification):
    try:
        list_findings_response = codeguru_security.get_findings(
            scanName=scan_name)
    except ClientError as e:
        logger.error(e)
        send_notification({"status": CommandStatus.ERROR, "message": str(e)})
        return
    findings = list_findings_response['findings']
    send_notification(
        {"status": CommandStatus.COMPLETED, "message": len(findings)})
    return findings


def get_cell_md(py_filepath):
    # cell_md is a 2D array where each inner array has the following structure
    # [cell_number, range_start, range_end, cumulative_length, final_offset]
    # cell_number: 0-index cell number, which may not be sequential depending on execution order
    # range_start: line number (inclusive) in .py file which the cell range starts
    # range_end: line number (inclusive) in .py file which the cell range ends
    # cumulative_length: number of lines of the current cell plus all the cells before it in the original order
    # final_offset: the number to add to .py line number to get the .ipynb line
    cell_md = []
    with open(py_filepath) as f:
        for i, line in enumerate(f):
            m = re.match("__CELL_EDGE__\((.+)\)", line)
            if m and m.group(1):
                if len(cell_md) - 1 >= 0:
                    cell_md[len(cell_md) - 1].append(i)
                cell_number = int(m.group(1))
                cell_md.append([cell_number, i + 2])
        cell_md[len(cell_md) - 1].append(i + 2)
        cell_md.sort(key=lambda cell_md: cell_md[0])

        for i, c in enumerate(cell_md):
            c.append(c[2] - c[1] + (cell_md[i - 1][3] if i > 0 else 0))
            c.append(cell_md[i - 1][3] + 3 * c[0] - c[1] if i > 0 else -c[1])

        return cell_md


def get_message_for_finding(finding, py_filepath, is_nb_file):
    start_line = finding['vulnerability']['filePath']['startLine']
    end_line = finding['vulnerability']['filePath']['endLine']
    message = finding['remediation']['recommendation']['text']
    detector_id = finding['detectorId']
    detector_name = finding['detectorName']
    severity = finding['severity']

    with open(py_filepath) as f:
        lines = f.readlines()
        start_char = len(lines[start_line - 1]) - \
            len(lines[start_line - 1].lstrip())
        end_char = len(lines[end_line - 1])

    offset = -1
    if is_nb_file:
        cell_md = get_cell_md(py_filepath)
        for c in cell_md:
            if start_line >= c[1] and start_line <= c[2]:
                offset = c[4]
                break
    actual_start_line = start_line + offset
    actual_end_line = end_line + offset

    return {
        "source": "codeguru-security",
        "code": detector_id,
        "message": "Issue: {detector_name}\n\nSuggested remediation: {remediation}".format(detector_name=detector_name, remediation=message),
        "range": {
            "start": {"line": actual_start_line, "character": start_char},
            "end": {"line": actual_end_line, "character": end_char}
        },
        "severity": lsp.DiagnosticSeverity.Information if severity == 'Info' else lsp.DiagnosticSeverity.Warning
    }


def get_diagnostics(workspace: Workspace, document: Document, overridden_region: str):
    codeguru_security = get_codeguru_security_client(overridden_region)

    with workspace.report_progress("command: runScan") as send_notification:
        send_notification({"status": CommandStatus.PENDING})
        is_nb_file = document.filename.endswith(".ipynb")
        py_filepath = create_python_from_notebook(
            document.filename) if is_nb_file else document.filename
        zip_filepath = create_zip_from_python(py_filepath)
        scan_name = "{}-{}".format(os.path.basename(zip_filepath),
                                   datetime.now().isoformat())
        code_artifact_id = upload_file(
            zip_filepath, scan_name, codeguru_security, send_notification)
        run_id = create_scan(code_artifact_id, scan_name,
                             codeguru_security, send_notification)
        poll_scan_status(scan_name, run_id,
                         codeguru_security, send_notification)
        findings = get_scan_findings(
            scan_name, codeguru_security, send_notification)
        return list(map(partial(get_message_for_finding, py_filepath=py_filepath, is_nb_file=is_nb_file), findings))


def flatten(list_of_lists):
    return [item for lst in list_of_lists for item in lst]


def get_diagnostics_from_other_sources(config: Config, workspace: Workspace, document: Document):
    plugin = config.plugin_manager.get_plugin(PLUGIN_NAME)
    hook_handlers = config.plugin_manager.subset_hook_caller(
        'pylsp_lint', config.disabled_plugins + [plugin])
    return flatten(hook_handlers(config=config, workspace=workspace, document=document, is_saved=False))
