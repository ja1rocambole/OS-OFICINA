const { contextBridge, ipcRenderer } = require('electron')

const api = {
  saveCustomer: (customerData) => ipcRenderer.invoke('save-customer', customerData),
  getCustomers: () => ipcRenderer.invoke('get-customers')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.api = api
}
