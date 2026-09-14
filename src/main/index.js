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
