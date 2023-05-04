import { ILSPFeatureManager } from '@jupyter-lsp/jupyterlab-lsp';
import { CodeMirrorIntegration } from '@jupyter-lsp/jupyterlab-lsp/lib/editor_integration/codemirror';
import { IFeatureCommand } from '@jupyter-lsp/jupyterlab-lsp/lib/feature';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { MainAreaWidget } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStatusBar } from '@jupyterlab/statusbar';
import { AboutCodeGuru } from './components/About';
import { CreateCodeScanButtonExtension } from './components/CodeScanButton';
import { CodeScanStatus } from './components/CodeScanStatus';
import {
  CODEGURU_RUN_SCAN_LABEL,
  PLUGIN_ID,
  REGISTER_ID,
  RUN_CODEGURU_SCAN_ID
} from './constants';
import { codeGuruIconGray } from './constants/icons';
import { IProgressMessageResponse } from './constants/interface';
import { DEFAULT_AWS_REGION, Region } from './constants/region';

class CodeGuruCM extends CodeMirrorIntegration {}

let overriddenRegion = DEFAULT_AWS_REGION;

const COMMANDS = (button: CreateCodeScanButtonExtension): IFeatureCommand[] => [
  {
    id: RUN_CODEGURU_SCAN_ID,
    label: CODEGURU_RUN_SCAN_LABEL,
    icon: codeGuruIconGray,
    execute: ({ connection, document }) => {
      let token: string;
      if (connection?.isConnected) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const wsConnection = connection.connection;
        void wsConnection.sendRequest('workspace/executeCommand', {
          command: 'cgs.runScan',
          arguments: [document.document_info.uri, overriddenRegion]
        });

        wsConnection.onNotification(
          '$/progress',
          (response: IProgressMessageResponse) => {
            if (response.value.title === 'command: runScan') {
              token = response.token;
            }
            if (
              token === response.token &&
              response.value.kind === 'report' &&
              response.value.message
            ) {
              button.emitStatusChange(response.value.message);
            }
          }
        );
      }
    },
    is_enabled: () => true,
    rank: 4
  }
];

/**
 * Initialization data for the @aws/amazon-codeguru-extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: `${PLUGIN_ID}:plugin`,
  autoStart: true,
  requires: [ILSPFeatureManager, IStatusBar, ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    featureManager: ILSPFeatureManager,
    statusBar: IStatusBar,
    settings: ISettingRegistry
  ) => {
    // Todo: remove this before launch
    console.log(
      'JupyterLab extension @aws/amazon-codeguru-extension is activated!'
    );

    const button = new CreateCodeScanButtonExtension(app);
    const statusWidget = new CodeScanStatus({
      status: 'idle',
      listener: button.stateChanged
    });

    app.docRegistry.addWidgetExtension('Notebook', button);

    featureManager.register({
      feature: {
        editorIntegrationFactory: new Map([['CodeMirrorEditor', CodeGuruCM]]),
        id: REGISTER_ID.CREATE_CODE_SCAN,
        name: 'CodeGuru Security',
        commands: COMMANDS(button)
      }
    });

    // Codescan status in footer
    statusBar.registerStatusItem(REGISTER_ID.SCAN_STATUS, {
      align: 'middle',
      item: statusWidget,
      rank: 20
    });

    // Settings
    let scanFrequency = 120;
    let disableAutoScan = false;
    let timeOutToken: NodeJS.Timeout;
    /**
     * Load the settings for this extension
     *
     * @param setting Extension settings
     */
    function loadSetting(setting: ISettingRegistry.ISettings): void {
      // Read the settings and convert to the correct type
      scanFrequency = setting.get('scanFrequency').composite as number;
      disableAutoScan = setting.get('disableAutoScan').composite as boolean;
      overriddenRegion = setting.get('region').composite as Region;

      // clearing interval before setting new interval or disabling autoscan
      if (timeOutToken) {
        clearInterval(timeOutToken);
      }
      if (!disableAutoScan && scanFrequency > 0) {
        timeOutToken = setInterval(() => {
          app.commands.execute(`lsp:${RUN_CODEGURU_SCAN_ID}-notebook`);
        }, scanFrequency * 1000);
      }
    }

    // Wait for the application to be restored and
    // for the settings for this plugin to be loaded
    Promise.all([app.restored, settings.load(`${PLUGIN_ID}:plugin`)])
      .then(([, setting]) => {
        // Read the settings
        loadSetting(setting);

        // Listen for your plugin setting changes using Signal
        setting.changed.connect(loadSetting);
      })
      .catch(reason => {
        console.error(`Error while reading the settings.\n${reason}`);
      });

    // About page
    const aboutCodeGuruWidget = () => {
      // Create a blank content widget inside of a MainAreaWidget
      const about = new AboutCodeGuru();
      const widget = new MainAreaWidget({ content: about });
      widget.id = 'about-codeguru';
      widget.title.label = 'Get started with CodeGuru';
      widget.title.icon = codeGuruIconGray;
      widget.title.closable = true;
      return widget;
    };
    let widget = aboutCodeGuruWidget();

    app.commands.addCommand(`${PLUGIN_ID}:about-codeguru`, {
      label: 'About CodeGuru',
      execute: () => {
        // Regenerate the widget if disposed
        if (widget.isDisposed) {
          widget = aboutCodeGuruWidget();
        }
        if (!widget.isAttached) {
          // Attach the widget to the main work area if it's not there
          app.shell.add(widget, 'main');
        }
        // Activate the widget
        app.shell.activateById(widget.id);
      }
    });

    // // Uncomment while testing about page
    // app.contextMenu.addItem({
    //   command: `${PLUGIN_ID}:about-codeguru`,
    //   selector: '.jp-Cell'
    // });
  }
};

export default plugin;
