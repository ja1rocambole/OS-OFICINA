import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/main/index.js'),
          database: resolve('src/main/database.js'),
          'handlers/customerHandlers': resolve('src/main/handlers/customerHandlers.js'),
          'handlers/employeeHandlers': resolve('src/main/handlers/employeeHandlers.js'),
          'handlers/vehicleHandlers': resolve('src/main/handlers/vehicleHandlers.js'),
          'handlers/partHandlers': resolve('src/main/handlers/partHandlers.js'),
          'handlers/serviceOrderHandlers': resolve('src/main/handlers/serviceOrderHandlers.js'),
          'handlers/serviceOrderPartHandlers': resolve(
            'src/main/handlers/serviceOrderPartHandlers.js'
          ),
          'handlers/serviceOrderLaborHandlers': resolve(
            'src/main/handlers/serviceOrderLaborHandlers.js'
          )
        }
      }
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
