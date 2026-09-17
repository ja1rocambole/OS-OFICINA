const registerServiceOrderHandlers = (ipcMain, db) => {
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

  ipcMain.handle('save-service-order', (event, serviceOrder) => {
    const allowedStatuses = ['Quote', 'Open', 'In Progress', 'Completed', 'Canceled']
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
    const status = serviceOrder.status || 'Quote'
    if (!Number.isInteger(mileage) || mileage < 0) {
      throw new Error('Mileage cannot be negative')
    }
    if (!allowedStatuses.includes(status)) {
      throw new Error('Invalid service order status')
    }

    const info = db
      .prepare(
        `
        INSERT INTO service_orders (
          customer_id, vehicle_id, employee_id, mileage, reported_defect, mechanic_notes, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        serviceOrder.customerId,
        serviceOrder.vehicleId,
        serviceOrder.employeeId || null,
        mileage,
        serviceOrder.reportedDefect.trim(),
        serviceOrder.mechanicNotes || null,
        status
      )

    return { success: true, id: info.lastInsertRowid }
  })

  ipcMain.handle('update-service-order-status', (event, data) => {
    const allowedStatuses = ['Quote', 'Open', 'In Progress', 'Completed', 'Canceled']
    if (!data.serviceOrderId || !allowedStatuses.includes(data.status)) {
      throw new Error('Service order and valid status are required')
    }

    const serviceOrder = db
      .prepare('SELECT id FROM service_orders WHERE id = ?')
      .get(data.serviceOrderId)
    if (!serviceOrder) {
      throw new Error('Service order not found')
    }

    const exitDate = ['Completed', 'Canceled'].includes(data.status) ? 'CURRENT_TIMESTAMP' : 'NULL'
    const info = db
      .prepare(
        `
        UPDATE service_orders
        SET status = ?, exit_date = ${exitDate}
        WHERE id = ?
      `
      )
      .run(data.status, data.serviceOrderId)

    if (info.changes === 0) {
      throw new Error('Service order was not updated')
    }

    return { success: true }
  })
}

module.exports = registerServiceOrderHandlers
