import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import {
  excluirMatricula,
  listarAlunosTurmaEscola,
  matricularNovoAluno,
  salvarTransferenciaAlunoTurma,
  salvarTransferenciasAlunosTurma,
} from '../repositories/AlunoRepository'
import {
  alterarNomeTurma,
  atualizarPresencaChamada,
  buscaChamadaTurmaRealizada,
  historicoFrequenciaAlunosTurma,
  inserirTurma,
  listarTurmasEscola,
  salvarChamadaTurma,
} from '../repositories/TurmaRepository'
import MensageriaService from '../services/MensageriaService'

class TurmaController {
  async criarTurma(app: FastifyInstance) {
    const bodyTurma = z.object({
      nome: z.string(),
    })

    app.post('/', async (req, res) => {
      const { nome } = await bodyTurma.parseAsync(req.body)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const turma = await inserirTurma({ nome, idEscola })

        res.status(201).send(turma)
      } else {
        res.status(401).send({
          message: 'Sessão encerrada!',
        })
      }
    })
  }

  async listarTurmas(app: FastifyInstance) {
    app.get('/', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const turmas = await listarTurmasEscola(idEscola)

        res.status(200).send(turmas)
      } else {
        res.status(401).send({
          message: 'Sessão encerrada!',
        })
      }
    })
  }

  async renomearTurma(app: FastifyInstance) {
    const paramTurma = z.object({
      id: z.string().uuid(),
    })

    const bodyTurma = z.object({
      nome: z.string(),
    })

    app.patch('/:id', async (req, res) => {
      const { id } = await paramTurma.parseAsync(req.params)

      const { nome } = await bodyTurma.parseAsync(req.body)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const alteraTurma = await alterarNomeTurma(nome, idEscola, id)

        res.status(200).send(alteraTurma)
      } else {
        res.status(401).send({
          message: 'Sessão encerrada!',
        })
      }
    })
  }

  async listarAlunosTurma(app: FastifyInstance) {
    const paramTurma = z.object({
      id: z.string().uuid(),
    })

    app.get('/:id/alunos', async (req, res) => {
      const { id } = await paramTurma.parseAsync(req.params)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const alunos = await listarAlunosTurmaEscola(idEscola, id)

        res.status(200).send(alunos)
      } else {
        res.status(401).send({
          message: 'Sessão encerrada!',
        })
      }
    })
  }

  async matricularAlunoTurma(app: FastifyInstance) {
    const schemaBodyAluno = z.object({
      nome: z.string({
        required_error: 'O nome do aluno é obrigatório',
      }),
      cpf: z.string({
        required_error: 'O CPF do aluno é obrigatório',
      }),
      rg: z.string({
        required_error: 'O RG do aluno é obrigatório',
      }),
      ra: z.string({
        required_error: 'O RA do aluno é obrigatório',
      }),
      dataNascimento: z.string({
        required_error: 'A data de nascimento do aluno é obrigatória',
      }),
      nomeResponsavel: z.string({
        required_error: 'O nome do responsável é obrigatório',
      }),
      cpfResponsavel: z.string({
        required_error: 'O CPF do responsável é obrigatório',
      }),
      telefones: z.array(
        z.object({
          ddd: z.string({
            required_error: 'O DDD do telefone é obrigatório',
          }),
          telefone: z
            .string({
              required_error: 'O número do telefone é obrigatório',
            })
            .min(9, {
              message: 'Telefone inválido',
            }),
          whatsapp: z.boolean().default(false),
        }),
        {
          required_error: 'O telefone é obrigatório',
        }
      ),
    })

    const paramTurma = z.object({
      id: z.string(),
    })

    app.post('/:id/aluno/matricula', async (req, res) => {
      const { id } = await paramTurma.parseAsync(req.params)

      const {
        nome,
        cpf,
        rg,
        ra,
        dataNascimento,
        nomeResponsavel,
        cpfResponsavel,
        telefones,
      } = await schemaBodyAluno.parseAsync(req.body)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const aluno = await matricularNovoAluno({
          nome,
          cpf,
          rg,
          ra,
          dataNascimento: new Date(dataNascimento),
          nomeResponsavel,
          cpfResponsavel,
          telefones,
          idTurma: id,
        })

        res.status(201).send(aluno)
      }
    })
  }

  async transferirAlunoTurma(app: FastifyInstance) {
    const bodyTurma = z.object({
      idTurma: z.string().uuid(),
    })

    const paramAluno = z.object({
      id: z.string().uuid(),
    })

    app.patch('/aluno/:id/transferir', async (req, res) => {
      const cookieSession = req.cookies

      if (cookieSession['session-company']) {
        const { id } = await paramAluno.parseAsync(req.params)

        const { idTurma } = await bodyTurma.parseAsync(req.body)

        const transferencia = await salvarTransferenciaAlunoTurma(id, idTurma)

        res.status(201).send(transferencia)
      } else {
        res.status(401).send({
          message: 'Sessão encerrada!',
        })
      }
    })
  }

  async transferirAlunosTurma(app: FastifyInstance) {
    const bodyTransferencias = z.object({
      alunos: z.array(
        z.object({
          id: z.string().uuid(),
        })
      ),
      idTurma: z.string().uuid(),
    })

    app.patch('/alunos/transferencias', async (req, res) => {
      const cookieSession = req.cookies

      if (cookieSession['session-company']) {
        const { alunos, idTurma } = await bodyTransferencias.parseAsync(
          req.body
        )

        try {
          await salvarTransferenciasAlunosTurma(
            alunos.map(aluno => aluno.id),
            idTurma
          )

          res.status(200).send({
            message: 'Transferências realizadas com sucesso',
          })
        } catch (error) {
          res.status(400).send({
            message: 'Houve um problema ao fazer transferencias dos alunos',
          })
        }
      } else {
        res.status(401).send({
          message: 'Sessão encerrada!',
        })
      }
    })
  }

  async excluirMatriculaAluno(app: FastifyInstance) {
    const paramAluno = z.object({
      id: z.string().uuid(),
    })

    app.delete('/aluno/:id', async (req, res) => {
      const { id } = await paramAluno.parseAsync(req.params)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const aluno = await excluirMatricula(id, idEscola)

        res.status(200).send(aluno)
      } else {
        res.status(401).send({
          message: 'Sessão encerrada!',
        })
      }
    })
  }

  async realizarChamadaTurma(app: FastifyInstance) {
    const bodyChamada = z.object({
      chamada: z.array(
        z.object({
          idAluno: z.string().uuid(),
          presente: z.boolean().default(false),
          dataChamada: z.coerce.date(),
        })
      ),
    })

    const paramTurma = z.object({
      id: z.string().uuid(),
    })

    app.post('/:id/chamada', async (req, res) => {
      const { id } = await paramTurma.parseAsync(req.params)
      const { chamada } = await bodyChamada.parseAsync(req.body)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        try {
          const chamadaTurmaRealizada = await buscaChamadaTurmaRealizada(
            id,
            idEscola,
            chamada[0].dataChamada,
          )

          if (chamadaTurmaRealizada) {

            res.status(200).send({
              message: 'Chamada já realizada para essa turma nesta data',
            })

            return
          }

          const dadosChamada = chamada.map(aluno => {
            return {
              idAluno: aluno.idAluno,
              presenca: aluno.presente,
              dataChamada: aluno.dataChamada,
            }
          })

          await salvarChamadaTurma(dadosChamada)
        } catch (error) {
          res.status(500).send({
            message: 'Houve um problema ao salvar a chamada do dia',
          })
        }

        const listaAlunosAusentes = chamada.filter(aluno => !aluno.presente)

        if (listaAlunosAusentes.length > 0) {
          const notificarResponsaveis = new MensageriaService(
            listaAlunosAusentes.map(aluno => aluno.idAluno),
            idEscola
          )

          const notificacaoResponsaveis =
            await notificarResponsaveis.dispararNotificacaoAusencia({
              modeloMensagem: 'Prezado(a) responsável, o aluno(a) $nomeAluno não compareceu à aula hoje.',
            })

          if (notificacaoResponsaveis.status) {
            res.status(201).send({
              status: true,
              msg: 'Chamada salvo com sucesso!',
            })
          } else {
            res.status(200).send({
              status: false,
              msg: 'Não foi possível notificar os responsáveis.',
            })
          }
        }
      } else {
        res.status(401).send({
          message: 'Sessão encerrada!',
        })
      }
    })
  }

  async historicoFrequenciaTurma(app: FastifyInstance) {
    const schemaParam = z.object({
      turma: z.string().uuid(),
    })

    const schemaQueryParam = z.object({
      inicio: z.coerce.date(),
      fim: z.coerce.date()
    })

    app.get('/chamada/:turma', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (!idEscola) {
        res.status(401).send({
          status: false,
          msg: 'Sessão encerrada!',
        })

        return
      }

      const { turma } = await schemaParam.parseAsync(req.params)
      const { inicio, fim } = await schemaQueryParam.parseAsync(req.query)

      const historicoFrequencia = await historicoFrequenciaAlunosTurma({
        escolaId: idEscola,
        turmaId: turma,
        dataLetivoInicio: inicio,
        dataLetivoFim: fim
      })

      res.status(200).send(historicoFrequencia.map(({ id, idAluno, aluno, dataChamada, presenca }) => ({
        id,
        idAluno,
        dataChamada,
        presenca,
        nome: aluno.nome
      })))
    })
  }

  async verificaChamadaRealizadaTurma(app: FastifyInstance) {
    const schemaParam = z.object({
      turma: z.string().uuid(),
    })

    const schemaQueryParam = z.object({
      dataChamada: z.coerce.date(),
    })

    app.get('/:turma/verificacao', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (!idEscola) {
        res.status(401).send({
          status: false,
          msg: 'Sessão encerrada!',
        })

        return
      }

      const { turma } = await schemaParam.parseAsync(req.params)
      const { dataChamada } = await schemaQueryParam.parseAsync(req.query)

      const chamadaTurmaRealizada = await buscaChamadaTurmaRealizada(
        turma,
        idEscola,
        dataChamada,
      )

      if (chamadaTurmaRealizada) {

        res.status(200).send({
          status: true,
          msg: 'Chamada realizada nessa turma!',
          chamada: true,
        })

        return
      }

      res.status(200).send({
        status: true,
        msg: 'Chamada não realizada nessa turma!',
        chamada: false
      })
    })
  }

  async alterarPresencaChamada(app: FastifyInstance) {
    const bodySchema = z.object({
      presenca: z.boolean(),
    })

    const paramSchema = z.object({
      id: z.string().uuid('ID da chamada inválido'),
    })

    app.patch('/chamada/:id', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (!idEscola) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        const { id } = await paramSchema.parseAsync(req.params)
        const { presenca } = await bodySchema.parseAsync(req.body)

        const resultado = await atualizarPresencaChamada(id, presenca, idEscola)

        if (resultado.count === 0) {
          return res.status(404).send({
            mensagem: 'Chamada não encontrada',
          })
        }

        return res.status(200).send({
          mensagem: 'Presença atualizada com sucesso',
          presenca,
        })
      } catch (error) {
        console.error('❌ Erro ao atualizar presença:', error)
        return res.status(400).send({
          mensagem: 'Erro ao atualizar presença',
          erro: error instanceof Error ? error.message : String(error),
        })
      }
    })
  }
}

export default TurmaController
