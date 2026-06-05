import { initDatabase } from './database.js'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function bootstrap() {
  try {
    await initDatabase()
    console.log('Database initialized successfully')

    if (process.env.SEED_ON_STARTUP === 'true') {
      console.log('Running seed data initialization...')
      try {
        await execAsync('node --import tsx api/seed.ts', {
          cwd: '/app',
          env: process.env,
        })
        console.log('Seed data completed successfully')
      } catch (seedError: any) {
        console.warn('Seed data warning (may already exist):', seedError.message)
      }
    }

    const { default: app } = await import('./app.js')
    const PORT = process.env.PORT || 3001

    const server = app.listen(PORT, () => {
      console.log(`Server ready on port ${PORT}`)
      console.log(`Static files served from /app/dist`)
      console.log(`Health check: http://localhost:${PORT}/api/health`)
    })

    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', () => {
      console.log('SIGINT signal received')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

bootstrap()
