/* eslint-disable no-case-declarations */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import {
  buscarConfiguracoesApiWhatsapp,
  buscarDisciplinasEscola,
  excluirDisciplina,
  inserirDisciplina,
  inserirEscola,
  inserirModeloMensagem,
  listarModelosMensagem,
  removerModeloMensagem,
} from '../repositories/EscolaRepository'
import {
  inserirUsuarioEscola,
  listarUsuariosEscola,
  modificarSenhaUsuario,
  modificarStatus,
} from '../repositories/UsuarioRepository'
import WhatsAppChatPro from '../services/whatsapp/WhatsAppChatPro'
import { criptografarSenha } from '../utils/Bcrypt'

class EscolaController {
  async criarEscola(app: FastifyInstance) {
    const bodyEscola = z.object({
      nomeEscola: z.string(),
      nomeUsuario: z.string(),
      emailUsuario: z.string().email(),
      senhaUsuario: z.string().min(8),
    })

    app.post('/', async (req, res) => {
      const { nomeEscola, nomeUsuario, emailUsuario, senhaUsuario } =
        await bodyEscola.parseAsync(req.body)

      const criaEscola = await inserirEscola({
        nomeEscola,
        emailUsuario,
        senhaUsuario: criptografarSenha(senhaUsuario),
        nomeUsuario,
      })

      res.status(201).send(criaEscola)
    })
  }

  async adicionarUsuarioEscola(app: FastifyInstance) {
    const bodyUsuarioEscola = z.object({
      nome: z.string(),
      email: z.string().email(),
      senha: z.string().min(8),
      perfil: z.enum(['PROFESSOR', 'ADMIN']).default('PROFESSOR'),
    })

    app.post('/usuario', async (req, res) => {
      const { nome, email, senha, perfil } = await bodyUsuarioEscola.parseAsync(
        req.body
      )

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const criaUsuarioEscola = await inserirUsuarioEscola({
          nome,
          email,
          senha: criptografarSenha(senha),
          perfil,
          status: true,
          idEscola,
        })

        res.status(201).send(criaUsuarioEscola)
      } else {
        res.status(401).send({
          mensagem: 'Usuário não logado',
        })
      }
    })
  }

  async listarUsuariosEscola(app: FastifyInstance) {
    const querySchema = z.object({
      perfil: z.enum(['ADMIN', 'PROFESSOR']).optional(),
    })

    app.get('/usuario', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        try {
          const { perfil } = await querySchema.parseAsync(req.query)
          const usuariosEscola = await listarUsuariosEscola(idEscola, perfil)

          res.status(200).send(usuariosEscola)
        } catch (error) {
          res.status(400).send({
            mensagem: 'Erro ao listar usuários',
            erro: error,
          })
        }
      } else {
        res.status(401).send({
          mensagem: 'Usuário não logado',
        })
      }
    })
  }

  async alterarStatusUsuario(app: FastifyInstance) {
    const paramsUsuario = z.object({
      id: z.string().uuid(),
    })

    const bodyStatusUsuario = z.object({
      status: z.boolean(),
    })

    app.patch('/usuario/:id', async (req, res) => {
      const { id } = await paramsUsuario.parseAsync(req.params)
      const { status } = await bodyStatusUsuario.parseAsync(req.body)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const alterarStatusUsuario = await modificarStatus(id, idEscola, status)

        res.status(200).send(alterarStatusUsuario)
      } else {
        res.status(401).send({
          mensagem: 'Usuário não logado',
        })
      }
    })
  }

  async criarModeloMensagem(app: FastifyInstance) {
    const bodyModeloMensagem = z.object({
      assunto: z.string(),
      modelo: z.string(),
    })

    app.post('/modelo', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const { assunto, modelo } = await bodyModeloMensagem.parseAsync(
          req.body
        )

        const criaModeloMensagem = await inserirModeloMensagem({
          assunto,
          modelo,
          idEscola,
        })

        res.status(201).send(criaModeloMensagem)
      } else {
        res.status(401).send({
          mensagem: 'Usuário não logado',
        })
      }
    })
  }

  async removerModeloMensagem(app: FastifyInstance) {
    const paramsModeloMensagem = z.object({
      id: z.string().uuid(),
    })

    app.delete('/modelo/:id', async (req, res) => {
      const { id } = await paramsModeloMensagem.parseAsync(req.params)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        await removerModeloMensagem(id)

        res.status(204).send()
      } else {
        res.status(401).send({
          mensagem: 'Usuário não logado',
        })
      }
    })
  }

  async listarModelosMensagemEscola(app: FastifyInstance) {
    app.get('/modelo', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const modelosMensagem = await listarModelosMensagem(idEscola)

        res.status(200).send(modelosMensagem)
      } else {
        res.status(401).send({
          mensagem: 'Usuário não logado',
        })
      }
    })
  }

  async configurarApiWhatsApp(app: FastifyInstance) {
    const bodyConfiguracaoApi = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      token_dispositivo_api_whatsapp: z.string(),
    })

    const searchParams = z.object({
      id: z.string().uuid().optional(),
    })

    app.post('/configuracoes/whatsapp', async (req, res) => {
      // eslint-disable-next-line camelcase
      const { email, password, token_dispositivo_api_whatsapp } =
        await bodyConfiguracaoApi.parseAsync(req.body)

      const { id } = await searchParams.parseAsync(req.query)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      const servicoChatPro = new WhatsAppChatPro(
        password,
        token_dispositivo_api_whatsapp
      )

      const configuraServicoChatPro = await servicoChatPro.configurarServico({
        id,
        email,
        password,
        idEscola,
      })

      if (configuraServicoChatPro) {
        res.status(201).send(configuraServicoChatPro)
      }

      res.status(500).send({
        msg: 'Erro ao configurar o serviço',
      })
    })
  }

  async buscarConfiguracoesApiWhatsapp(app: FastifyInstance) {
    app.get('/configuracoes/whatsapp', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        const configuracoesApiWhatsapp =
          await buscarConfiguracoesApiWhatsapp(idEscola)

        res.status(200).send(configuracoesApiWhatsapp)
      } else {
        res.status(401).send({
          mensagem: 'Usuário não logado',
        })
      }
    })
  }

  async novaDisciplina(app: FastifyInstance) {
    const schemaBody = z.object({
      nome: z.string(),
    })

    app.post('/disciplina', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      const { nome } = await schemaBody.parseAsync(req.body)

      const salvaDisciplina = await inserirDisciplina({
        nome,
        idEscola: idEscola ?? '',
      })

      res.status(201).send(salvaDisciplina)
    })
  }

  async listarDisciplinaEscola(app: FastifyInstance) {
    app.get('/disciplina', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      const listaDisciplinas = await buscarDisciplinasEscola(idEscola ?? '')

      res.status(200).send(listaDisciplinas)
    })
  }

  async removerDisciplina(app: FastifyInstance) {
    const paramDisciplina = z.object({
      id: z.string().uuid(),
    })

    app.delete('/disciplina/:id', async (req, res) => {
      const { id } = await paramDisciplina.parseAsync(req.params)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      const excluiDisciplina = await excluirDisciplina({
        idDisciplina: id,
        idEscola: idEscola ?? '',
      })

      res.status(200).send(excluiDisciplina)
    })
  }

  async alterarSenhaUsuario(app: FastifyInstance) {
    const bodySenhaUsuarioEscola = z.object({
      novaSenha: z.string().min(8),
    })

    const paramsUsuario = z.object({
      id: z.string().uuid(),
    })

    app.put('/usuario/:id/senha', async (req, res) => {
      const { novaSenha } = await bodySenhaUsuarioEscola.parseAsync(
        req.body
      )

      const { id } = await paramsUsuario.parseAsync(req.params)

      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (idEscola) {
        try {
          await modificarSenhaUsuario({
            id,
            senha: criptografarSenha(novaSenha),
            idEscola,
          })

          res.status(200).send({
            status: true,
            msg: 'Senha alterada com sucesso',
          })
        }
        catch (error) {
          res.status(500).send({
            status: false,
            msg: 'Erro ao alterar a senha',
          })
        }
      } else {
        res.status(401).send({
          status: true,
          msg: 'Usuário não logado',
        })
      }
    })
  }
}

export default EscolaController
