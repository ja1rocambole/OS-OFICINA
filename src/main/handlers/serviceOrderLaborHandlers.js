const registerServiceOrderLaborHandlers = (ipcMain, db) => {
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

  ipcMain.handle('remove-service-order-labor', (event, itemId) => {
    if (!itemId) {
      throw new Error('Service order labor id is required')
    }

    const removeLabor = db.transaction(() => {
      const item = db
        .prepare('SELECT service_order_id, labor_cost FROM service_order_labor WHERE id = ?')
        .get(itemId)
      if (!item) {
        throw new Error('Service order labor not found')
      }

      db.prepare('DELETE FROM service_order_labor WHERE id = ?').run(itemId)
      db.prepare('UPDATE service_orders SET total_amount = total_amount - ? WHERE id = ?').run(
        item.labor_cost,
        item.service_order_id
      )
    })

    removeLabor()
    return { success: true }
  })
}

module.exports = registerServiceOrderLaborHandlers
