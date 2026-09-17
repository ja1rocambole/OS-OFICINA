const registerVehicleHandlers = (ipcMain, db) => {
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

  ipcMain.handle('save-vehicle', (event, vehicle) => {
    if (!vehicle.customerId || !vehicle.licensePlate || !vehicle.licensePlate.trim()) {
      throw new Error('Customer and license plate are required')
    }

    const customerExists = db
      .prepare('SELECT id FROM customers WHERE id = ?')
      .get(vehicle.customerId)
    if (!customerExists) {
      throw new Error('Customer not found')
    }

    const licensePlate = vehicle.licensePlate.trim().toUpperCase()
    validateVehicleFields(licensePlate, vehicle.year)

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

  ipcMain.handle('update-vehicle', (event, vehicle) => {
    if (!vehicle.id || !vehicle.customerId || !vehicle.licensePlate?.trim()) {
      throw new Error('Vehicle id, customer and license plate are required')
    }

    const customerExists = db
      .prepare('SELECT id FROM customers WHERE id = ?')
      .get(vehicle.customerId)
    if (!customerExists) {
      throw new Error('Customer not found')
    }

    const licensePlate = vehicle.licensePlate.trim().toUpperCase()
    validateVehicleFields(licensePlate, vehicle.year)

    const duplicate = db
      .prepare('SELECT id FROM vehicles WHERE license_plate = ? AND id <> ?')
      .get(licensePlate, vehicle.id)
    if (duplicate) {
      throw new Error('License plate already registered')
    }

    const info = db
      .prepare(
        `
        UPDATE vehicles
        SET customer_id = ?, license_plate = ?, brand = ?, model = ?, year = ?, color = ?
        WHERE id = ?
      `
      )
      .run(
        vehicle.customerId,
        licensePlate,
        vehicle.brand || null,
        vehicle.model || null,
        vehicle.year || null,
        vehicle.color || null,
        vehicle.id
      )

    if (info.changes === 0) {
      throw new Error('Vehicle not found')
    }

    return { success: true }
  })

  ipcMain.handle('delete-vehicle', (event, vehicleId) => {
    if (!vehicleId) {
      throw new Error('Vehicle id is required')
    }

    const order = db
      .prepare('SELECT id FROM service_orders WHERE vehicle_id = ? LIMIT 1')
      .get(vehicleId)
    if (order) {
      throw new Error('Vehicle has service order history')
    }

    const info = db.prepare('DELETE FROM vehicles WHERE id = ?').run(vehicleId)
    if (info.changes === 0) {
      throw new Error('Vehicle not found')
    }

    return { success: true }
  })
}

const validateVehicleFields = (licensePlate, year) => {
  if (!/^[A-Z0-9]{7,8}$/.test(licensePlate)) {
    throw new Error('License plate must contain 7 or 8 letters and numbers')
  }

  if (year && !/^\d{4}$/.test(String(year))) {
    throw new Error('Vehicle year must contain four digits')
  }
}

module.exports = registerVehicleHandlers
