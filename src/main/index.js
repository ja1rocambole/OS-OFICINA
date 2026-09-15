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

// Listar peças
ipcMain.handle('get-parts', () => {
  const stmt = db.prepare('SELECT * FROM parts ORDER BY description')
  return stmt.all()
})

// Salvar peça
ipcMain.handle('save-part', (event, part) => {
  if (!part.description || !part.description.trim()) {
    throw new Error('Part description is required')
  }

  const stockQuantity = Number(part.stockQuantity || 0)
  const costPrice = Number(part.costPrice || 0)
  const sellingPrice = Number(part.sellingPrice || 0)

  if (stockQuantity < 0 || costPrice < 0 || sellingPrice < 0) {
    throw new Error('Part values cannot be negative')
  }

  const stmt = db.prepare(`
    INSERT INTO parts (internal_code, description, stock_quantity, cost_price, selling_price)
    VALUES (?, ?, ?, ?, ?)
  `)
  const info = stmt.run(
    part.internalCode || null,
    part.description.trim(),
    stockQuantity,
    costPrice,
    sellingPrice
  )

  return { success: true, id: info.lastInsertRowid }
})

// Atualizar peça
ipcMain.handle('update-part', (event, part) => {
  if (!part.id || !part.description || !part.description.trim()) {
    throw new Error('Part id and description are required')
  }

  const stockQuantity = Number(part.stockQuantity || 0)
  const costPrice = Number(part.costPrice || 0)
  const sellingPrice = Number(part.sellingPrice || 0)

  if (stockQuantity < 0 || costPrice < 0 || sellingPrice < 0) {
    throw new Error('Part values cannot be negative')
  }

  const stmt = db.prepare(`
    UPDATE parts
    SET internal_code = ?, description = ?, stock_quantity = ?, cost_price = ?, selling_price = ?
    WHERE id = ?
  `)
  const info = stmt.run(
    part.internalCode || null,
    part.description.trim(),
    stockQuantity,
    costPrice,
    sellingPrice,
    part.id
  )

  if (info.changes === 0) {
    throw new Error('Part not found')
  }

  return { success: true }
})

// Listar Funcionários ativos
ipcMain.handle('get-employees', () => {
  const stmt = db.prepare('SELECT * FROM employees WHERE is_active = 1 ORDER BY name')
  return stmt.all()
})

// Listar ordens de serviço
ipcMain.handle('get-service-orders', () => {
  const stmt = db.prepare(`
    SELECT
      service_orders.*,
      customers.name AS customer_name,
      vehicles.license_plate,
      vehicles.brand,
      vehicles.model,
      employees.name AS employee_name
    FROM service_orders
    JOIN customers ON customers.id = service_orders.customer_id
    JOIN vehicles ON vehicles.id = service_orders.vehicle_id
    LEFT JOIN employees ON employees.id = service_orders.employee_id
    ORDER BY service_orders.id DESC
  `)
  return stmt.all()
})

// Criar ordem de serviço
ipcMain.handle('save-service-order', (event, serviceOrder) => {
  if (!serviceOrder.customerId || !serviceOrder.vehicleId) {
    throw new Error('Customer and vehicle are required')
  }

  if (!serviceOrder.reportedDefect || !serviceOrder.reportedDefect.trim()) {
    throw new Error('Reported defect is required')
  }

  const vehicle = db
    .prepare('SELECT id FROM vehicles WHERE id = ? AND customer_id = ?')
    .get(serviceOrder.vehicleId, serviceOrder.customerId)

  if (!vehicle) {
    throw new Error('Vehicle does not belong to customer')
  }

  if (serviceOrder.employeeId) {
    const employee = db
      .prepare('SELECT id FROM employees WHERE id = ? AND is_active = 1')
      .get(serviceOrder.employeeId)

    if (!employee) {
      throw new Error('Employee not found')
    }
  }

  const mileage = Number(serviceOrder.mileage || 0)
  if (mileage < 0) {
    throw new Error('Mileage cannot be negative')
  }

  const stmt = db.prepare(`
    INSERT INTO service_orders (
      customer_id, vehicle_id, employee_id, mileage, reported_defect, mechanic_notes, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const info = stmt.run(
    serviceOrder.customerId,
    serviceOrder.vehicleId,
    serviceOrder.employeeId || null,
    mileage,
    serviceOrder.reportedDefect.trim(),
    serviceOrder.mechanicNotes || null,
    serviceOrder.status || 'Quote'
  )

  return { success: true, id: info.lastInsertRowid }
})

// Consultar os itens e a mão de obra de uma ordem de serviço
ipcMain.handle('get-service-order-details', (event, serviceOrderId) => {
  if (!serviceOrderId) {
    throw new Error('Service order id is required')
  }

  const parts = db
    .prepare(
      `
      SELECT service_order_parts.*, parts.description, parts.internal_code
      FROM service_order_parts
      JOIN parts ON parts.id = service_order_parts.part_id
      WHERE service_order_id = ?
      ORDER BY service_order_parts.id
    `
    )
    .all(serviceOrderId)

  const labor = db
    .prepare(
      `
      SELECT * FROM service_order_labor
      WHERE service_order_id = ?
      ORDER BY id
    `
    )
    .all(serviceOrderId)

  return { parts, labor }
})

// Adicionar peça à ordem de serviço e baixar o estoque na mesma transação
ipcMain.handle('add-service-order-part', (event, item) => {
  if (!item.serviceOrderId || !item.partId) {
    throw new Error('Service order and part are required')
  }

  const quantity = Number(item.quantity)
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Part quantity must be a positive integer')
  }

  const addPart = db.transaction(() => {
    const serviceOrder = db
      .prepare('SELECT id FROM service_orders WHERE id = ?')
      .get(item.serviceOrderId)
    const part = db
      .prepare('SELECT id, stock_quantity, selling_price FROM parts WHERE id = ?')
      .get(item.partId)

    if (!serviceOrder) {
      throw new Error('Service order not found')
    }
    if (!part) {
      throw new Error('Part not found')
    }
    if (part.stock_quantity < quantity) {
      throw new Error('Insufficient part stock')
    }

    db.prepare(
      `
      INSERT INTO service_order_parts (service_order_id, part_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `
    ).run(item.serviceOrderId, item.partId, quantity, part.selling_price)

    db.prepare(
      `
      UPDATE parts
      SET stock_quantity = stock_quantity - ?
      WHERE id = ?
    `
    ).run(quantity, item.partId)

    db.prepare(
      `
      UPDATE service_orders
      SET total_amount = total_amount + ?
      WHERE id = ?
    `
    ).run(quantity * part.selling_price, item.serviceOrderId)
  })

  addPart()
  return { success: true }
})

// Adicionar mão de obra à ordem de serviço
ipcMain.handle('add-service-order-labor', (event, item) => {
  if (!item.serviceOrderId || !item.description || !item.description.trim()) {
    throw new Error('Service order and labor description are required')
  }

  const laborCost = Number(item.laborCost)
  if (!Number.isFinite(laborCost) || laborCost < 0) {
    throw new Error('Labor cost must be a non-negative number')
  }

  const addLabor = db.transaction(() => {
    const serviceOrder = db
      .prepare('SELECT id FROM service_orders WHERE id = ?')
      .get(item.serviceOrderId)

    if (!serviceOrder) {
      throw new Error('Service order not found')
    }

    db.prepare(
      `
      INSERT INTO service_order_labor (service_order_id, description, labor_cost)
      VALUES (?, ?, ?)
    `
    ).run(item.serviceOrderId, item.description.trim(), laborCost)

    db.prepare(
      `
      UPDATE service_orders
      SET total_amount = total_amount + ?
      WHERE id = ?
    `
    ).run(laborCost, item.serviceOrderId)
  })

  addLabor()
  return { success: true }
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
