import * as path from 'path';
import {
  Command,
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window,
} from 'vscode';
import { SidebarColumn } from './sidebar-column';

export class SidebarTable extends TreeItem {
  public iconPath = {
    dark: path.join(__dirname, '..', '..', 'resources', 'icon', 'database-dark.png'),
    light: path.join(__dirname, '..', '..', 'resources', 'icon', 'database-light.png'),
  };
  public contextValue = 'table';

  public columns: SidebarColumn[] = [];
  constructor(
    public readonly label: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
    this.contextValue = 'connection.table';
  }

}
