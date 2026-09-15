const { app, BrowserWindow, ipcMain } = require('electron')
const { join, resolve } = require('path')

// Em desenvolvimento o arquivo gerado em out/main não contém o banco.
// Então apontamos explicitamente para o arquivo do projeto para que o Electron consiga resolver o módulo.
const db = require(resolve(__dirname, '../../src/main/database.js'))

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      // Conecta o arquivo preload para a ponte de segurança funcionar
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Carrega o arquivo HTML do frontend
  win.loadFile(join(__dirname, '../renderer/index.html'))
}

// --- 3. REGRAS DE NEGÓCIO (Ouvindo os pedidos do Frontend) ---

// Salvar Cliente
ipcMain.handle('save-customer', (event, customer) => {
  const stmt = db.prepare(`
    INSERT INTO customers (name, phone, document, address)
    VALUES (?, ?, ?, ?)
  `)

  // O .run() executa a inserção substituindo as interrogações (?) pelos valores
  const info = stmt.run(customer.name, customer.phone, customer.document, customer.address)

  // Retorna para o frontend o ID que o banco acabou de gerar
  return { success: true, id: info.lastInsertRowid }
})

// Listar Clientes
ipcMain.handle('get-customers', () => {
  const stmt = db.prepare('SELECT * FROM customers')
  return stmt.all() // Retorna um array com todos os clientes cadastrados
})

// Listar veículos de um cliente
ipcMain.handle('get-vehicles-by-customer', (event, customerId) => {
  if (!customerId) {
    return []
  }

  const stmt = db.prepare(`
    SELECT * FROM vehicles
    WHERE customer_id = ?
    ORDER BY license_plate
  `)
  return stmt.all(customerId)
})

// Salvar veículo
ipcMain.handle('save-vehicle', (event, vehicle) => {
  if (!vehicle.customerId || !vehicle.licensePlate || !vehicle.licensePlate.trim()) {
    throw new Error('Customer and license plate are required')
  }

  const customerExists = db.prepare('SELECT id FROM customers WHERE id = ?').get(vehicle.customerId)

  if (!customerExists) {
    throw new Error('Customer not found')
  }

  const licensePlate = vehicle.licensePlate.trim().toUpperCase()
  const plateExists = db
    .prepare('SELECT id FROM vehicles WHERE license_plate = ?')
    .get(licensePlate)

  if (plateExists) {
    throw new Error('License plate already registered')
  }

  const stmt = db.prepare(`
    INSERT INTO vehicles (customer_id, license_plate, brand, model, year, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const info = stmt.run(
    vehicle.customerId,
    licensePlate,
    vehicle.brand || null,
    vehicle.model || null,
    vehicle.year || null,
    vehicle.color || null
  )

  return { success: true, id: info.lastInsertRowid }
})

// Listar Funcionários ativos
ipcMain.handle('get-employees', () => {
  const stmt = db.prepare('SELECT * FROM employees WHERE is_active = 1 ORDER BY name')
  return stmt.all()
})

// Salvar Funcionário
ipcMain.handle('save-employee', (event, employee) => {
  if (!employee.name || !employee.name.trim()) {
    throw new Error('Employee name is required')
  }

  const stmt = db.prepare(`
    INSERT INTO employees (name, phone, document, role)
    VALUES (?, ?, ?, ?)
  `)
  const info = stmt.run(
    employee.name.trim(),
    employee.phone || null,
    employee.document || null,
    employee.role || null
  )

  return { success: true, id: info.lastInsertRowid }
})

// Atualizar Funcionário
ipcMain.handle('update-employee', (event, employee) => {
  if (!employee.id || !employee.name || !employee.name.trim()) {
    throw new Error('Employee id and name are required')
  }

  const stmt = db.prepare(`
    UPDATE employees
    SET name = ?, phone = ?, document = ?, role = ?
    WHERE id = ? AND is_active = 1
  `)
  const info = stmt.run(
    employee.name.trim(),
    employee.phone || null,
    employee.document || null,
    employee.role || null,
    employee.id
  )

  if (info.changes === 0) {
    throw new Error('Employee not found')
  }

  return { success: true }
})

// Desativar Funcionário sem remover o histórico
ipcMain.handle('delete-employee', (event, employeeId) => {
  if (!employeeId) {
    throw new Error('Employee id is required')
  }

  const stmt = db.prepare('UPDATE employees SET is_active = 0 WHERE id = ?')
  const info = stmt.run(employeeId)

  if (info.changes === 0) {
    throw new Error('Employee not found')
  }

  return { success: true }
})

// --- 4. INICIALIZAÇÃO DO SISTEMA ---

app.whenReady().then(() => {
  createWindow()

  // Comportamento padrão do Mac OS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Comportamento padrão do Windows e Linux (fecha o processo ao fechar a janela)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
