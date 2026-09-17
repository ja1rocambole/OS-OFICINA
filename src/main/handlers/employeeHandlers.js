const registerEmployeeHandlers = (ipcMain, db) => {
  ipcMain.handle('get-employees', () => {
    const stmt = db.prepare('SELECT * FROM employees WHERE is_active = 1 ORDER BY name')
    return stmt.all()
  })

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
}

module.exports = registerEmployeeHandlers
