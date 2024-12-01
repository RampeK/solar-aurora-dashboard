import { app, Menu, BrowserWindow, dialog, MenuItemConstructorOptions } from 'electron';

export function createMenu(mainWindow: BrowserWindow) {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Data',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog({
              defaultPath: 'aurora_forecast.json',
              filters: [{ name: 'JSON', extensions: ['json'] }]
            });
            if (filePath) {
              mainWindow.webContents.send('export-data');
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Solar Activity',
          click: () => mainWindow.webContents.send('show-view', 'solar')
        },
        {
          label: 'Aurora Forecast',
          click: () => mainWindow.webContents.send('show-view', 'aurora')
        },
        {
          label: 'Satellite Data',
          click: () => mainWindow.webContents.send('show-view', 'satellite')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Notifications',
          type: 'checkbox',
          checked: true,
          click: (menuItem: Electron.MenuItem) => {
            mainWindow.webContents.send('toggle-notifications', menuItem.checked);
          }
        },
        {
          label: 'Update Interval',
          submenu: [
            {
              label: '5 minutes',
              type: 'radio',
              checked: false,
              click: () => mainWindow.webContents.send('set-update-interval', 5)
            },
            {
              label: '15 minutes',
              type: 'radio',
              checked: true,
              click: () => mainWindow.webContents.send('set-update-interval', 15)
            },
            {
              label: '30 minutes',
              type: 'radio',
              checked: false,
              click: () => mainWindow.webContents.send('set-update-interval', 30)
            }
          ]
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About Aurora Forecast',
              message: 'Aurora Forecast v1.0.0\nData provided by NASA DONKI API',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
} 