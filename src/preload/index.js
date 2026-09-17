const { contextBridge, ipcRenderer } = require('electron')

const api = {
  saveCustomer: (customerData) => ipcRenderer.invoke('save-customer', customerData),
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  updateCustomer: (customerData) => ipcRenderer.invoke('update-customer', customerData),
  getVehiclesByCustomer: (customerId) => ipcRenderer.invoke('get-vehicles-by-customer', customerId),
  saveVehicle: (vehicleData) => ipcRenderer.invoke('save-vehicle', vehicleData),
  updateVehicle: (vehicleData) => ipcRenderer.invoke('update-vehicle', vehicleData),
  deleteVehicle: (vehicleId) => ipcRenderer.invoke('delete-vehicle', vehicleId),
  getParts: () => ipcRenderer.invoke('get-parts'),
  savePart: (partData) => ipcRenderer.invoke('save-part', partData),
  updatePart: (partData) => ipcRenderer.invoke('update-part', partData),
  getServiceOrders: () => ipcRenderer.invoke('get-service-orders'),
  saveServiceOrder: (serviceOrderData) =>
    ipcRenderer.invoke('save-service-order', serviceOrderData),
  getServiceOrderDetails: (serviceOrderId) =>
    ipcRenderer.invoke('get-service-order-details', serviceOrderId),
  addServiceOrderPart: (itemData) => ipcRenderer.invoke('add-service-order-part', itemData),
  addServiceOrderLabor: (itemData) => ipcRenderer.invoke('add-service-order-labor', itemData),
  removeServiceOrderPart: (itemId) => ipcRenderer.invoke('remove-service-order-part', itemId),
  removeServiceOrderLabor: (itemId) => ipcRenderer.invoke('remove-service-order-labor', itemId),
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
