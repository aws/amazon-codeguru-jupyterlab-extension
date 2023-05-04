import { JupyterFrontEnd } from '@jupyterlab/application';
import { ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { DisposableDelegate, IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';
import { CODEGURU_RUN_SCAN_LABEL, RUN_CODEGURU_SCAN_ID } from '../constants';
import { codeGuruIconGray } from '../constants/icons';
import { ICodeScanResponse } from '../constants/interface';

export class CreateCodeScanButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  app: JupyterFrontEnd;
  private _stateChanged: Signal<
    CreateCodeScanButtonExtension,
    ICodeScanResponse
  > = new Signal<CreateCodeScanButtonExtension, ICodeScanResponse>(this);
  constructor(app: JupyterFrontEnd) {
    this.app = app;
    this.handleClick = this.handleClick.bind(this);
  }

  emitStatusChange(response: ICodeScanResponse): void {
    this._stateChanged.emit(response);
  }

  protected handleClick(): void {
    this.app.commands.execute(`lsp:${RUN_CODEGURU_SCAN_ID}-notebook`);
  }

  createNew(panel: NotebookPanel): IDisposable {
    const button = new ToolbarButton({
      icon: codeGuruIconGray,
      onClick: this.handleClick,
      tooltip: CODEGURU_RUN_SCAN_LABEL
    });

    panel.toolbar.insertItem(10, CODEGURU_RUN_SCAN_LABEL, button);

    return new DisposableDelegate(() => {
      button.dispose();
    });
  }

  public get stateChanged(): ISignal<
    CreateCodeScanButtonExtension,
    ICodeScanResponse
  > {
    return this._stateChanged;
  }
}
