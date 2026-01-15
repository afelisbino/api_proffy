import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import {
  atualizarVinculosTurmasProfessor,
  desvincularTurmaProfessor,
  listarTurmasProfessor,
  vincularTurmaProfessor,
} from '../repositories/TurmasProfessorRepository'
import { consultarUsuario } from '../repositories/UsuarioRepository'
import { listarTurmasEscola } from '../repositories/TurmaRepository'

class TurmasProfessorController {
  async minhasTurmas(app: FastifyInstance) {
    app.get('/minhas-turmas', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']
      const idUsuarioLogado = cookieSession['session-user']

      if (!idEscola || !idUsuarioLogado) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        // Buscar perfil do usuário logado
        const usuario = await consultarUsuario(idUsuarioLogado)

        if (!usuario) {
          return res.status(401).send({
            mensagem: 'Usuário não encontrado',
          })
        }

        if (usuario.perfil === 'PROFESSOR') {
          const vinculos = await listarTurmasProfessor({
            idEscola,
            idUsuarioLogado,
            perfilUsuario: usuario.perfil,
          })

          return res.status(200).send({
            turmas: vinculos.map(v => ({
              id: v.idTurma,
              nome: v.nomeTurma,
            })),
          })
        }
        const turmas = await listarTurmasEscola(idEscola)

        return res.status(200).send({
          turmas: turmas.map(t => ({
            id: t.id,
            nome: t.nome,
          })),
        })

      } catch (error) {
        return res.status(400).send({
          mensagem: 'Erro ao listar turmas',
          erro: error,
        })
      }
    })
  }

  async listarVinculos(app: FastifyInstance) {
    const querySchema = z.object({
      idProfessor: z.string().uuid().optional(),
      idTurma: z.string().uuid().optional(),
    })

    app.get('/listar', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']
      const idUsuarioLogado = cookieSession['session-user']

      if (!idEscola || !idUsuarioLogado) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        const filtros = await querySchema.parseAsync(req.query)

        // Buscar perfil do usuário logado
        const usuario = await consultarUsuario(idUsuarioLogado)

        if (!usuario) {
          return res.status(401).send({
            mensagem: 'Usuário não encontrado',
          })
        }

        const vinculos = await listarTurmasProfessor({
          idEscola,
          idUsuarioLogado,
          perfilUsuario: usuario.perfil,
          ...filtros,
        })

        return res.status(200).send({
          vinculos,
        })
      } catch (error) {
        return res.status(400).send({
          mensagem: 'Erro ao listar vínculos',
          erro: error,
        })
      }
    })
  }

  async vincularTurma(app: FastifyInstance) {
    const bodySchema = z.object({
      idTurma: z.string().uuid('ID da turma inválido'),
      idProfessor: z.string().uuid('ID do professor inválido'),
    })

    app.post('/vincular', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (!idEscola) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        const dados = await bodySchema.parseAsync(req.body)

        const vinculo = await vincularTurmaProfessor(dados)

        return res.status(201).send({
          mensagem: 'Turma vinculada com sucesso',
          vinculo,
        })
      } catch (error) {
        const mensagemErro =
          error instanceof Error ? error.message : 'Erro ao vincular turma'

        return res.status(400).send({
          mensagem: mensagemErro,
          erro: error,
        })
      }
    })
  }

  async desvincularTurma(app: FastifyInstance) {
    const bodySchema = z.object({
      idTurma: z.string().uuid('ID da turma inválido'),
      idProfessor: z.string().uuid('ID do professor inválido'),
    })

    app.delete('/desvincular', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (!idEscola) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        const dados = await bodySchema.parseAsync(req.body)

        await desvincularTurmaProfessor(dados)

        return res.status(200).send({
          mensagem: 'Turma desvinculada com sucesso',
        })
      } catch (error) {
        const mensagemErro =
          error instanceof Error
            ? error.message
            : 'Erro ao desvincular turma'

        return res.status(400).send({
          mensagem: mensagemErro,
          erro: error,
        })
      }
    })
  }

  async atualizarVinculos(app: FastifyInstance) {
    const bodySchema = z.object({
      idProfessor: z.string().uuid('ID do professor inválido'),
      idsTurmas: z
        .array(z.string().uuid('ID de turma inválido'))
        .min(0, 'Lista de turmas é obrigatória'),
    })

    app.put('/atualizar-vinculos', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (!idEscola) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        const dados = await bodySchema.parseAsync(req.body)

        const resultado = await atualizarVinculosTurmasProfessor(dados)

        return res.status(200).send({
          mensagem: 'Vínculos atualizados com sucesso',
          resultado,
        })
      } catch (error) {
        return res.status(400).send({
          mensagem: 'Erro ao atualizar vínculos',
          erro: error,
        })
      }
    })
  }
}

export default TurmasProfessorController
