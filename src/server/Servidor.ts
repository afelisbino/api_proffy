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
      logger: false,
      bodyLimit: 30 * 1024 * 1024,
    })

    this.servico.register(cors, {
      origin:
        process.env.NODE_ENV && process.env.NODE_ENV === 'production'
          ? 'https://app.proffy.manstock.com.br'
          : true,
      credentials: true,
      exposedHeaders: ['Content-Disposition'],
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
      })
      .catch((error: string) => {
        console.log(`🪲 Erro ao inicializar o servidor: ${error}`)
        process.exit(1)
      })
  }
}

export default Servidor
