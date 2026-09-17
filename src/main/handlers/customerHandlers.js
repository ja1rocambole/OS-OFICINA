const registerCustomerHandlers = (ipcMain, db) => {
  ipcMain.handle('save-customer', (event, customer) => {
    if (!customer.name || !customer.name.trim()) {
      throw new Error('Customer name is required')
    }

    const stmt = db.prepare(`
      INSERT INTO customers (name, phone, document, address)
      VALUES (?, ?, ?, ?)
    `)
    const info = stmt.run(
      customer.name.trim(),
      customer.phone || null,
      customer.document || null,
      customer.address || null
    )

    return { success: true, id: info.lastInsertRowid }
  })

  ipcMain.handle('get-customers', () => {
    const stmt = db.prepare('SELECT * FROM customers ORDER BY name')
    return stmt.all()
  })

  ipcMain.handle('update-customer', (event, customer) => {
    if (!customer.id || !customer.name || !customer.name.trim()) {
      throw new Error('Customer id and name are required')
    }

    const stmt = db.prepare(`
      UPDATE customers
      SET name = ?, phone = ?, document = ?, address = ?
      WHERE id = ?
    `)
    const info = stmt.run(
      customer.name.trim(),
      customer.phone || null,
      customer.document || null,
      customer.address || null,
      customer.id
    )

    if (info.changes === 0) {
      throw new Error('Customer not found')
    }

    return { success: true }
  })
}

module.exports = registerCustomerHandlers
