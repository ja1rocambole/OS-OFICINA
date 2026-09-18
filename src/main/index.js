const { app, BrowserWindow, ipcMain } = require('electron')
const { join } = require('path')

const db = require('./database.js')
const registerCustomerHandlers = require('./handlers/customerHandlers.js')
const registerEmployeeHandlers = require('./handlers/employeeHandlers.js')
const registerVehicleHandlers = require('./handlers/vehicleHandlers.js')
const registerPartHandlers = require('./handlers/partHandlers.js')
const registerServiceOrderHandlers = require('./handlers/serviceOrderHandlers.js')
const registerServiceOrderPartHandlers = require('./handlers/serviceOrderPartHandlers.js')
const registerServiceOrderLaborHandlers = require('./handlers/serviceOrderLaborHandlers.js')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.maximize()
  win.loadFile(join(__dirname, '../renderer/index.html'))
}

registerCustomerHandlers(ipcMain, db)
registerEmployeeHandlers(ipcMain, db)
registerVehicleHandlers(ipcMain, db)
registerPartHandlers(ipcMain, db)
registerServiceOrderHandlers(ipcMain, db)
registerServiceOrderPartHandlers(ipcMain, db)
registerServiceOrderLaborHandlers(ipcMain, db)

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
