import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import {
  alterarBloqueioNotificacaoAluno,
  alterarPermissaoNotificacaoTelefoneResponsavel,
  buscarDadosAluno,
  consultaResponsavelPorDocumento,
  removerContatoResponsavel,
  removerVinculoResponsavelAluno,
  salvarEdicaoDadosResponsavel,
  salvarEdicaoMatriculaAluno,
  salvarNovoResponsavelAluno,
  salvarNovosTelefones,
  vincularResponsavelAluno,
} from '../repositories/AlunoRepository'

class MatriculaAlunoController {
  async consultarDadosMatriculaAluno(app: FastifyInstance) {
    const schemaParams = z.object({
      id: z.string().uuid(),
    })

    app.get('/aluno/:id', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const { id } = await schemaParams.parseAsync(req.params)

        try {
          const matriculaAluno = await buscarDadosAluno(id, idEscola)

          res.status(200).send({
            status: true,
            msg: 'Aluno encontrado com sucesso',
            dados: matriculaAluno,
          })
        } catch (err) {
          res.status(404).send({
            status: false,
            msg: 'Aluno não encontrado',
            dados: null,
            error: err,
          })
        }
      } else {
        res.status(401).send({
          status: false,
          msg: 'Sessão encerrada!',
        })
      }
    })
  }

  async verificarExisteResponsavel(app: FastifyInstance) {
    const schemaSearchParams = z.object({
      doc: z.string().length(11),
    })

    app.get('/verifica/responsavel', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const { doc } = await schemaSearchParams.parseAsync(req.query)

        const responsavel = await consultaResponsavelPorDocumento(doc)

        if (!responsavel) {
          res.status(200).send({
            status: false,
            msg: 'Responsável não encontrado',
            dados: null,
          })
        } else {
          res.status(200).send({
            status: true,
            msg: 'Responsável encontrado com sucesso',
            dados: responsavel,
          })
        }
      } else {
        res.status(401).send({
          status: false,
          msg: 'Sessão encerrada!',
        })
      }
    })
  }

  async alterarStatusBloqueioNotificacao(app: FastifyInstance) {
    const schemaParams = z.object({
      id: z.string().uuid(),
    })

    const schemaBody = z.object({
      status: z.boolean(),
    })

    app.patch('/notificacao/aluno/:id', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const { id } = await schemaParams.parseAsync(req.params)
        const { status } = await schemaBody.parseAsync(req.body)

        try {
          const statusAluno = await alterarBloqueioNotificacaoAluno(
            id,
            status,
            idEscola
          )

          res.status(200).send({
            status: true,
            msg: 'Status da notificação alterado com sucesso',
            dados: {
              id: statusAluno.id,
              notificacaoBloqueado: statusAluno.notificacaoBloqueado,
            },
          })
        } catch (err) {
          res.status(400).send({
            status: false,
            msg: 'Erro ao alterar o status da notificação',
            error: err,
          })
        }
      } else {
        res.status(401).send({
          status: false,
          msg: 'Sessão encerrada!',
        })
      }
    })
  }

  async excluirContatoTelefonicoResponsavel(app: FastifyInstance) {
    const schemaParams = z.object({
      idResponsavel: z.string().uuid(),
      idContato: z.string().uuid(),
    })
    app.delete(
      '/responsavel/:idResponsavel/contato/:idContato',
      async (req, res) => {
        const cookieSession = req.cookies
        const idEscola = cookieSession['session-company']

        if (idEscola) {
          const { idResponsavel, idContato } = await schemaParams.parseAsync(
            req.params
          )

          try {
            const removeContato = await removerContatoResponsavel(
              idContato,
              idResponsavel
            )

            res.status(200).send({
              status: true,
              msg: 'Contato removido do responsável com sucesso',
              dados: removeContato,
            })
          } catch (err) {
            res.status(500).send({
              status: false,
              msg: 'Erro ao remover o contato do responsável',
              dados: null,
              error: err,
            })
          }
        } else {
          res.status(401).send({
            status: false,
            msg: 'Sessão encerrada!',
          })
        }
      }
    )
  }

  async atualizarDadosAluno(app: FastifyInstance) {
    const schemaBody = z.object({
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
      dataNascimento: z.coerce.date({
        required_error: 'A data de nascimento do aluno é obrigatória',
      }),
    })

    const schemaParams = z.object({
      id: z.string().uuid(),
    })

    app.put('/:id', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const { id } = await schemaParams.parseAsync(req.params)
        const { nome, cpf, rg, ra, dataNascimento } =
          await schemaBody.parseAsync(req.body)

        try {
          const dadosAluno = await salvarEdicaoMatriculaAluno({
            id,
            nome,
            cpf,
            rg,
            ra,
            dataNascimento,
            idEscola,
          })

          res.status(200).send({
            status: true,
            msg: 'Aluno atualizado com sucesso',
            dados: dadosAluno,
          })
        } catch (err) {
          res.status(400).send({
            status: false,
            msg: 'Erro ao atualizar os dados do aluno',
            error: err,
          })
        }
      } else {
        res.status(401).send({
          status: false,
          msg: 'Sessão encerrada!',
        })
      }
    })
  }

  async atualizarDadosResponsavel(app: FastifyInstance) {
    const schemaBody = z.object({
      nome: z.string({
        required_error: 'O nome do responsável é obrigatório',
      }),
      cpf: z.string({
        required_error: 'O CPF do responsável é obrigatório',
      }),
    })

    const schemaParams = z.object({
      id: z.string().uuid(),
    })

    app.put('/responsavel/:id', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const { id } = await schemaParams.parseAsync(req.params)
        const { nome, cpf } = await schemaBody.parseAsync(req.body)

        try {
          const dadosResponsavel = await salvarEdicaoDadosResponsavel({
            id,
            nome,
            cpf,
            telefones: [],
            idEscola,
          })

          res.status(200).send({
            status: true,
            msg: 'Responsável atualizado com sucesso',
            dados: dadosResponsavel,
          })
        } catch (err) {
          res.status(500).send({
            status: false,
            msg: 'Erro ao atualizar os dados do responsável',
            error: err,
          })
        }
      } else {
        res.status(401).send({
          status: false,
          msg: 'Sessão encerrada!',
        })
      }
    })
  }

  async vincularNovoResponsavelAluno(app: FastifyInstance) {
    const schemaBody = z.object({
      nome: z.string({
        required_error: 'O nome do responsável é obrigatório',
      }),
      cpf: z.string({
        required_error: 'O CPF do responsável é obrigatório',
      }),
    })

    const schemaParams = z.object({
      idAluno: z.string().uuid(),
    })

    app.post('/aluno/:idAluno/responsavel', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const { idAluno } = await schemaParams.parseAsync(req.params)
        const { nome, cpf } = await schemaBody.parseAsync(req.body)

        try {
          const dadosResponsavel = await consultaResponsavelPorDocumento(cpf)

          if (dadosResponsavel) {
            const dadosNovoResponsavelAluno = await vincularResponsavelAluno({
              idAluno,
              id: dadosResponsavel.id,
              idEscola,
              telefones: [],
              nome: '',
              cpf: '',
            })

            res.status(200).send({
              status: true,
              msg: 'Responsável vinculado ao aluno com sucesso',
              dados: dadosNovoResponsavelAluno,
            })
          } else {
            const dadosNovoResponsavel = await salvarNovoResponsavelAluno({
              idAluno,
              idEscola,
              telefones: [],
              nome,
              cpf,
            })

            res.status(200).send({
              status: true,
              msg: 'Responsável vinculado ao aluno com sucesso',
              dados: dadosNovoResponsavel,
            })
          }
        } catch (err) {
          res.status(400).send({
            status: false,
            msg: 'Erro ao vincular novo responsável ao aluno',
            error: err,
          })
        }
      } else {
        res.status(401).send({
          status: false,
          msg: 'Sessão encerrada!',
        })
      }
    })
  }

  async excluirVinculoResponsavelAluno(app: FastifyInstance) {
    const schemaParams = z.object({
      idAluno: z.string().uuid(),
      idResponsavel: z.string().uuid(),
    })

    app.delete(
      '/aluno/:idAluno/responsavel/:idResponsavel',
      async (req, res) => {
        const cookieSession = req.cookies
        const idEscola = cookieSession['session-company']

        if (idEscola) {
          const { idAluno, idResponsavel } = await schemaParams.parseAsync(
            req.params
          )

          try {
            const vinculoRemovido = await removerVinculoResponsavelAluno(
              idResponsavel,
              idAluno
            )

            res.status(200).send({
              status: true,
              msg: 'Responsável removido do aluno com sucesso',
              dados: vinculoRemovido,
            })
          } catch (err) {
            res.status(500).send({
              status: false,
              msg: 'Erro ao remover o responsável do aluno',
              error: err,
            })
          }
        } else {
          res.status(401).send({
            status: false,
            msg: 'Sessão encerrada!',
          })
        }
      }
    )
  }

  async atualizarPermissaoNotificacaoContato(app: FastifyInstance) {
    const schemaBody = z.object({
      statusBloqueio: z.boolean(),
    })

    const schemaParams = z.object({
      idResponsavel: z.string().uuid(),
      idContato: z.string().uuid(),
    })

    app.patch(
      '/responsavel/:idResponsavel/contato/:idContato/notificacao',
      async (req, res) => {
        const cookieSession = req.cookies
        const idEscola = cookieSession['session-company']

        if (idEscola) {
          const { idResponsavel, idContato } = await schemaParams.parseAsync(
            req.params
          )
          const { statusBloqueio } = await schemaBody.parseAsync(req.body)

          try {
            const alteraPermissaoNotificacaoContato =
              await alterarPermissaoNotificacaoTelefoneResponsavel(
                idContato,
                idResponsavel,
                statusBloqueio
              )

            res.status(200).send({
              status: true,
              msg: 'Permissão de notificação do contato atualizado com sucesso',
              dados: alteraPermissaoNotificacaoContato,
            })
          } catch (err) {
            res.status(500).send({
              status: false,
              msg: 'Erro ao atualizar permissão de notificação do contato',
              error: err,
            })
          }
        } else {
          res.status(401).send({
            status: false,
            msg: 'Sessão encerrada!',
          })
        }
      }
    )
  }

  async adicionarNovosContatos(app: FastifyInstance) {
    const schemaParams = z.object({
      idResponsavel: z.string().uuid(),
    })

    const schemaTelefones = z.object({
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

    app.post('/responsavel/:idResponsavel/contato', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const { idResponsavel } = await schemaParams.parseAsync(req.params)

        const { telefones } = await schemaTelefones.parseAsync(req.body)

        try {
          const adicionaContatos = await salvarNovosTelefones({
            idResponsavel,
            telefones,
          })

          res.status(200).send({
            status: true,
            msg: 'Contatos do responsável adicionados com sucesso',
            dados: adicionaContatos,
          })
        } catch (err) {
          res.status(500).send({
            status: false,
            msg: 'Erro ao adicionar novos contatos do responsável',
            dados: null,
            error: err,
          })
        }
      } else {
        res.status(401).send({
          status: false,
          msg: 'Sessão encerrada!',
        })
      }
    })
  }
}

export default MatriculaAlunoController
