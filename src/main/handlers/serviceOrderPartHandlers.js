const registerServiceOrderPartHandlers = (ipcMain, db) => {
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

  ipcMain.handle('remove-service-order-part', (event, itemId) => {
    if (!itemId) {
      throw new Error('Service order part id is required')
    }

    const removePart = db.transaction(() => {
      const item = db
        .prepare(
          `
          SELECT service_order_id, part_id, quantity, unit_price
          FROM service_order_parts
          WHERE id = ?
        `
        )
        .get(itemId)

      if (!item) {
        throw new Error('Service order part not found')
      }

      db.prepare('DELETE FROM service_order_parts WHERE id = ?').run(itemId)
      db.prepare('UPDATE parts SET stock_quantity = stock_quantity + ? WHERE id = ?').run(
        item.quantity,
        item.part_id
      )
      db.prepare('UPDATE service_orders SET total_amount = total_amount - ? WHERE id = ?').run(
        item.quantity * item.unit_price,
        item.service_order_id
      )
    })

    removePart()
    return { success: true }
  })
}

module.exports = registerServiceOrderPartHandlers
