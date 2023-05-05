import logging
import os
from typing import List
from pylsp import hookimpl
from pylsp.config.config import Config
from pylsp.workspace import Workspace, Document
from . import cfg
from .constants import DEFAULT_LOG_LOCATION, LOG_NAME, PLUGIN_NAME
from .diagnostics import get_diagnostics, get_diagnostics_from_other_sources

logging.basicConfig(
    filename=os.path.join(DEFAULT_LOG_LOCATION, LOG_NAME),
    filemode="a",
    force=True,
    format="%(asctime)s.%(msecs)d %(name)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
    level=logging.DEBUG)

logger = logging.getLogger(__name__)



@hookimpl
def pylsp_settings():
    logger.info("Initializing {}".format(PLUGIN_NAME))

    return {
        "plugins": {},
    }


@hookimpl
def pylsp_execute_command(config: Config, workspace: Workspace, command: str, arguments: List[str]):
    logger.info("workspace/executeCommand: %s %s", command, arguments)

    if command == "cgs.runScan":
        doc_uri = arguments[0]
        overridden_region = arguments[1]
        document = workspace.get_document(doc_uri)
        execute_run_scan(config, workspace, document, overridden_region)


@hookimpl
def pylsp_lint(config: Config, workspace: Workspace, document: Document, is_saved: bool):
    return cfg.diagnostics.get(document.uri)


def execute_run_scan(config: Config, workspace: Workspace, document: Document, overridden_region: str):
    other_diagnostics = get_diagnostics_from_other_sources(config, workspace, document)
    cfg.diagnostics[document.uri] = get_diagnostics(workspace, document, overridden_region)
    workspace.publish_diagnostics(doc_uri=document.uri, diagnostics=other_diagnostics + cfg.diagnostics.get(document.uri))


