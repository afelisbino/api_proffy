import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import PDFDocument from 'pdfkit'
import { z } from 'zod'

import {
  atualizarRelatorioAluno,
  buscarRelatorioParaPDF,
  inserirRelatorioAluno,
  listarRelatoriosAluno,
} from '../repositories/RelatorioAlunoRepository'

class RelatorioAlunoController {
  async listarRelatorios(app: FastifyInstance) {
    const querySchema = z.object({
      idTurma: z.string().uuid().optional(),
      idProfessor: z.string().uuid().optional(),
      periodo: z.string().optional(),
      tipoPeriodo: z
        .enum(['mensal', 'bimestral', 'trimestral', 'semestral'])
        .optional(),
    })

    app.get('/listar', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (!idEscola) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        const filtros = await querySchema.parseAsync(req.query)

        const relatorios = await listarRelatoriosAluno({
          idEscola,
          ...filtros,
        })

        return res.status(200).send({
          relatorios,
        })
      } catch (error) {
        return res.status(400).send({
          mensagem: 'Erro ao listar relatórios',
          erro: error,
        })
      }
    })
  }

  async cadastrarRelatorio(app: FastifyInstance) {
    const bodySchema = z.object({
      conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
      periodo: z.string().min(1, 'Período é obrigatório'),
      tipoPeriodo: z.enum(['mensal', 'bimestral', 'trimestral', 'semestral']),
      idAluno: z.string().uuid('ID do aluno inválido'),
    })

    app.post('/cadastrar', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']
      const idProfessor = cookieSession['session-user']

      if (!idEscola || !idProfessor) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        const dados = await bodySchema.parseAsync(req.body)

        const novoRelatorio = await inserirRelatorioAluno({
          ...dados,
          idProfessor,
        })

        return res.status(201).send({
          mensagem: 'Relatório cadastrado com sucesso',
          relatorio: novoRelatorio,
        })
      } catch (error) {
        return res.status(400).send({
          mensagem: 'Erro ao cadastrar relatório',
          erro: error,
        })
      }
    })
  }

  async editarRelatorio(app: FastifyInstance) {
    const bodySchema = z.object({
      id: z.string().uuid('ID do relatório inválido'),
      conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
      periodo: z.string().min(1, 'Período é obrigatório'),
      tipoPeriodo: z.enum(['mensal', 'bimestral', 'trimestral', 'semestral']),
    })

    app.put('/editar', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (!idEscola) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        const dados = await bodySchema.parseAsync(req.body)

        const relatorioAtualizado = await atualizarRelatorioAluno(dados)

        return res.status(200).send({
          mensagem: 'Relatório atualizado com sucesso',
          relatorio: relatorioAtualizado,
        })
      } catch (error) {
        return res.status(400).send({
          mensagem: 'Erro ao atualizar relatório',
          erro: error,
        })
      }
    })
  }

  async gerarRelatorioPDF(app: FastifyInstance) {
    const querySchema = z.object({
      id: z.string().uuid('ID do relatório inválido'),
    })

    app.get('/gerar-pdf', async (req, res) => {
      const cookieSession = req.cookies
      const idEscola = cookieSession['session-company']

      if (!idEscola) {
        return res.status(401).send({
          mensagem: 'Não autorizado',
        })
      }

      try {
        const { id } = await querySchema.parseAsync(req.query)
        console.log('📄 Buscando relatório para PDF:', { id, idEscola })

        const dados = await buscarRelatorioParaPDF(id, idEscola)
        console.log('📊 Dados encontrados:', dados ? 'Sim' : 'Não')

        if (!dados) {
          return res.status(404).send({
            mensagem: 'Relatório não encontrado',
          })
        }

        console.log('🎨 Iniciando geração de PDF...')
        // Gerar PDF - chamar como função estática
        return RelatorioAlunoController.gerarPDF(dados, req, res)
      } catch (error) {
        console.error('❌ Erro ao gerar PDF do relatório:', error)
        return res.status(400).send({
          mensagem: 'Erro ao gerar PDF do relatório',
          erro: error instanceof Error ? error.message : String(error),
        })
      }
    })
  }

  private static gerarPDF(
    dados: {
      nomeEscola: string
      nomeAluno: string
      nomeTurma: string
      nomeProfessor: string
      periodo: string
      tipoPeriodo: string
      conteudo: string
      criadoEm: Date
    },
    req: FastifyRequest,
    res: FastifyReply
  ) {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('🔧 Criando documento PDF...')
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: 'Relatório de Desempenho',
            Author: dados.nomeEscola,
          },
        })

        // Configurar headers de CORS e download
        res.raw.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
        res.raw.setHeader('Access-Control-Allow-Credentials', 'true')
        res.raw.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
        res.raw.setHeader('Content-Type', 'application/pdf')
        res.raw.setHeader(
          'Content-Disposition',
          `attachment; filename="relatorio-${dados.nomeAluno.replace(/\s+/g, '-')}.pdf"`
        )

        // Pipe do PDF para a resposta
        doc.pipe(res.raw)

        // === CABEÇALHO ===
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(dados.nomeEscola.toUpperCase(), { align: 'center' })
          .moveDown(0.5)

        doc
          .fontSize(14)
          .font('Helvetica')
          .text('RELATÓRIO DE DESEMPENHO DO ALUNO', { align: 'center' })
          .moveDown(1.5)

        // === DADOS DO ALUNO ===
        const yInicio = doc.y
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Aluno: ', { continued: true })
        doc.font('Helvetica').text(dados.nomeAluno)

        doc.font('Helvetica-Bold').text('Turma: ', { continued: true })
        doc.font('Helvetica').text(dados.nomeTurma)

        doc.font('Helvetica-Bold').text('Professor: ', { continued: true })
        doc.font('Helvetica').text(dados.nomeProfessor)

        doc.font('Helvetica-Bold').text('Período: ', { continued: true })
        doc
          .font('Helvetica')
          .text(`${dados.periodo}º ${dados.tipoPeriodo}`.toUpperCase())

        doc.moveDown(1.5)

        // === LINHA SEPARADORA ===
        doc
          .strokeColor('#cccccc')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke()
        doc.moveDown(1)

        // === CONTEÚDO DO RELATÓRIO ===
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#2E5090')
          .text('OBSERVAÇÕES DO PROFESSOR', { align: 'left' })
          .moveDown(0.5)

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#000000')
          .text(dados.conteudo, {
            align: 'justify',
            lineGap: 5,
          })

        // === RODAPÉ ===
        const dataGeracao = format(
          new Date(),
          "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
          {
            locale: ptBR,
          }
        )

        // Posicionar no final da página
        const alturaTotal = 842 // A4 height
        const margemInferior = 50
        const yRodape = alturaTotal - margemInferior - 40

        // Se houver espaço, usar a posição atual, senão forçar o rodapé
        const yFinal = doc.y + 40 > yRodape ? yRodape : doc.y + 40

        doc
          .fontSize(9)
          .fillColor('#666666')
          .text(`Relatório gerado em: ${dataGeracao}`, 50, yFinal, {
            align: 'center',
          })

        console.log('✅ Finalizando documento PDF...')
        doc.on('end', () => {
          console.log('✅ PDF finalizado com sucesso!')
          resolve()
        })
        doc.on('error', err => {
          console.error('❌ Erro no stream do PDF:', err)
          reject(err)
        })
        doc.end()
      } catch (error) {
        console.error('❌ Erro ao construir PDF:', error)
        reject(error)
      }
    })
  }
}

export default RelatorioAlunoController
