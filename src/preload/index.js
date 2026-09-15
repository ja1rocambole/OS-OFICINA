const { contextBridge, ipcRenderer } = require('electron')

const api = {
  saveCustomer: (customerData) => ipcRenderer.invoke('save-customer', customerData),
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  getVehiclesByCustomer: (customerId) => ipcRenderer.invoke('get-vehicles-by-customer', customerId),
  saveVehicle: (vehicleData) => ipcRenderer.invoke('save-vehicle', vehicleData),
  getParts: () => ipcRenderer.invoke('get-parts'),
  savePart: (partData) => ipcRenderer.invoke('save-part', partData),
  updatePart: (partData) => ipcRenderer.invoke('update-part', partData),
  getEmployees: () => ipcRenderer.invoke('get-employees'),
  saveEmployee: (employeeData) => ipcRenderer.invoke('save-employee', employeeData),
  updateEmployee: (employeeData) => ipcRenderer.invoke('update-employee', employeeData),
  deleteEmployee: (employeeId) => ipcRenderer.invoke('delete-employee', employeeId)
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
