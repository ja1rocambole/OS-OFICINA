const Database = require('better-sqlite3')
const { app } = require('electron')
const path = require('path')

// O nome do arquivo físico pode ser auto_shop.sqlite
const dbPath = path.join(app.getPath('userData'), 'auto_shop.sqlite')
const db = new Database(dbPath, { verbose: console.log })

db.pragma('foreign_keys = ON')

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      document TEXT,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      license_plate TEXT UNIQUE NOT NULL,
      brand TEXT,
      model TEXT,
      year TEXT,
      color TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      internal_code TEXT,
      description TEXT NOT NULL,
      stock_quantity REAL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      vehicle_id INTEGER,
      mileage INTEGER,
      reported_defect TEXT,
      mechanic_notes TEXT,
      status TEXT DEFAULT 'Quote',
      entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      exit_date DATETIME,
      total_amount REAL DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS service_order_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_order_id INTEGER,
      part_id INTEGER,
      quantity INTEGER,
      unit_price REAL,
      FOREIGN KEY (service_order_id) REFERENCES service_orders(id),
      FOREIGN KEY (part_id) REFERENCES parts(id)
    );

    CREATE TABLE IF NOT EXISTS service_order_labor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_order_id INTEGER,
      description TEXT NOT NULL,
      labor_cost REAL,
      FOREIGN KEY (service_order_id) REFERENCES service_orders(id)
    );
  `)
}

initDb()

module.exports = db
