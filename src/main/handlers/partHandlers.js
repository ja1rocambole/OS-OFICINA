const registerPartHandlers = (ipcMain, db) => {
  ipcMain.handle('get-parts', () => {
    const stmt = db.prepare('SELECT * FROM parts ORDER BY description')
    return stmt.all()
  })

  ipcMain.handle('save-part', (event, part) => {
    validatePart(part)

    const stmt = db.prepare(`
      INSERT INTO parts (internal_code, description, stock_quantity, cost_price, selling_price)
      VALUES (?, ?, ?, ?, ?)
    `)
    const info = stmt.run(
      part.internalCode || null,
      part.description.trim(),
      Number(part.stockQuantity || 0),
      Number(part.costPrice || 0),
      Number(part.sellingPrice || 0)
    )

    return { success: true, id: info.lastInsertRowid }
  })

  ipcMain.handle('update-part', (event, part) => {
    if (!part.id) {
      throw new Error('Part id is required')
    }
    validatePart(part)

    const info = db
      .prepare(
        `
        UPDATE parts
        SET internal_code = ?, description = ?, stock_quantity = ?, cost_price = ?, selling_price = ?
        WHERE id = ?
      `
      )
      .run(
        part.internalCode || null,
        part.description.trim(),
        Number(part.stockQuantity || 0),
        Number(part.costPrice || 0),
        Number(part.sellingPrice || 0),
        part.id
      )

    if (info.changes === 0) {
      throw new Error('Part not found')
    }

    return { success: true }
  })
}

const validatePart = (part) => {
  if (!part.description || !part.description.trim()) {
    throw new Error('Part description is required')
  }

  const values = [part.stockQuantity || 0, part.costPrice || 0, part.sellingPrice || 0].map(Number)
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('Part values cannot be negative')
  }
}

module.exports = registerPartHandlers
