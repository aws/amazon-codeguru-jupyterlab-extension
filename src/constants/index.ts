export const PLUGIN_ID = '@aws/amazon-codeguru-extension';

export enum REGISTER_ID {
  CREATE_CODE_SCAN = `${PLUGIN_ID}:create_scan_command`,
  SCAN_STATUS = `${PLUGIN_ID}:scan_status`
}

export const RUN_CODEGURU_SCAN_ID = 'run-codeguru-scan';

export const CODEGURU_RUN_SCAN_LABEL = 'Run CodeGuru scan';
