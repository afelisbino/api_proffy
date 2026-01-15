import fastifyCookie, { type FastifyCookieOptions } from '@fastify/cookie'
import cors from '@fastify/cors'
import fastify, { type FastifyInstance } from 'fastify'

class Servidor {
  private servico: FastifyInstance
  private host: string
  private port: number

  constructor(host: string, port: number) {
    this.host = host
    this.port = port

    this.servico = fastify({
      logger: true,
      bodyLimit: 30 * 1024 * 1024,
    })

    this.servico.register(cors, {
      origin: (origin, callback) => {
        // Lista de origens permitidas
        const allowedOrigins = [
          'https://app.proffy.manstock.com.br',
          'http://localhost:3000',
          'http://localhost:3001',
        ]

        // Em desenvolvimento, permite qualquer origem
        if (process.env.NODE_ENV !== 'production') {
          callback(null, true)
          return
        }

        // Em produção, verifica se a origem está na lista
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'), false)
        }
      },
      credentials: true,
      exposedHeaders: ['Content-Disposition'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })

    this.servico.register(fastifyCookie, {
      secret: process.env.COOKIE_SECRET,
      hook: 'onRequest',
    } as FastifyCookieOptions)
  }

  getServico(): FastifyInstance {
    return this.servico
  }

  inicializar() {
    this.servico
      .listen({
        host: this.host,
        port: this.port,
      })
      .then(() => {
        console.log(`🚀 Servidor online na porta: ${this.port}`)
        console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`)
        console.log(`🗄️  Banco de dados: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'não configurado'}`)
      })
      .catch((error: Error) => {
        console.error(`❌ Erro ao inicializar o servidor:`, error.message)
        console.error(`📋 Stack trace:`, error.stack)
        process.exit(1)
      })
  }
}

export default Servidor
