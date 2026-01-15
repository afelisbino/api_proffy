import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import PDFDocument from 'pdfkit'
import { z } from 'zod'

import { buscarDadosRelatorioFrequencia } from '../repositories/FrequenciaRepository'

class FrequenciaController {
  async gerarRelatorioFrequencia(app: FastifyInstance) {
    const querySchema = z.object({
      idAluno: z.string().uuid('ID do aluno inválido'),
      dataInicio: z.coerce.date(),
      dataFim: z.coerce.date(),
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
        const filtros = await querySchema.parseAsync(req.query)

        const dados = await buscarDadosRelatorioFrequencia({
          idEscola,
          ...filtros,
        })

        if (!dados) {
          return res.status(404).send({
            mensagem: 'Aluno não encontrado',
          })
        }

        // Validar datas
        if (filtros.dataInicio > filtros.dataFim) {
          return res.status(400).send({
            mensagem: 'Data de início não pode ser maior que data de fim',
          })
        }

        // Gerar PDF
        return FrequenciaController.gerarPDF(dados, req, res)
      } catch (error) {
        console.error('❌ Erro ao gerar relatório de frequência:', error)
        return res.status(400).send({
          mensagem: 'Erro ao gerar relatório de frequência',
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
      dataInicio: Date
      dataFim: Date
      chamadas: Array<{ dataChamada: Date; presenca: boolean }>
      totalAulas: number
      totalPresencas: number
      percentualFrequencia: number
    },
    req: FastifyRequest,
    res: FastifyReply,
  ) {
    return new Promise<void>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: 'Relatório de Frequência',
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
          `attachment; filename="frequencia-${dados.nomeAluno.replace(/\s+/g, '-')}.pdf"`
        )

        // Pipe do PDF para a resposta
        doc.pipe(res.raw)

        // === TÍTULO DO RELATÓRIO ===
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(dados.nomeEscola.toUpperCase(), { align: 'center' })
          .moveDown(0.5)

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('RELATÓRIO DE FREQUÊNCIA', { align: 'center' })
          .moveDown(1.5)

        // === INFORMAÇÕES DO ALUNO ===
        const startY = doc.y
        doc.fontSize(11).font('Helvetica')

        doc
          .font('Helvetica-Bold')
          .text('Aluno: ', 50, startY, { continued: true })
          .font('Helvetica')
          .text(dados.nomeAluno)

        doc
          .font('Helvetica-Bold')
          .text('Turma: ', 50, doc.y + 5, { continued: true })
          .font('Helvetica')
          .text(dados.nomeTurma)

        const periodoTexto = `${format(dados.dataInicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dados.dataFim, 'dd/MM/yyyy', { locale: ptBR })}`

        doc
          .font('Helvetica-Bold')
          .text('Período: ', 50, doc.y + 5, { continued: true })
          .font('Helvetica')
          .text(periodoTexto)

        doc.moveDown(1.5)

        // === TABELA DE CHAMADAS ===
        const tableTop = doc.y
        const colWidth = 245
        const rowHeight = 25

        // Cabeçalho da tabela
        doc
          .rect(50, tableTop, colWidth, rowHeight)
          .fillAndStroke('#2E5090', '#2E5090')

        doc
          .rect(50 + colWidth, tableTop, colWidth, rowHeight)
          .fillAndStroke('#2E5090', '#2E5090')

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('white')
          .text('DATA', 50, tableTop + 8, {
            width: colWidth,
            align: 'center',
          })
          .text('PRESENÇA', 50 + colWidth, tableTop + 8, {
            width: colWidth,
            align: 'center',
          })

        doc.fillColor('black')

        // Linhas da tabela
        let currentY = tableTop + rowHeight

        for (let i = 0; i < dados.chamadas.length; i++) {
          const chamada = dados.chamadas[i]
          const bgColor = i % 2 === 0 ? '#f0f0f0' : 'white'

          // Background zebrado
          doc.rect(50, currentY, colWidth * 2, rowHeight).fillAndStroke(bgColor, 'gray')

          // Data
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('black')
            .text(
              format(chamada.dataChamada, 'dd', { locale: ptBR }),
              50,
              currentY + 8,
              {
                width: colWidth,
                align: 'center',
              },
            )

          // Presença
          const presencaTexto = chamada.presenca ? 'PRESENTE' : 'FALTA'
          const presencaColor = chamada.presenca ? 'green' : 'red'

          doc
            .font('Helvetica-Bold')
            .fillColor(presencaColor)
            .text(presencaTexto, 50 + colWidth, currentY + 8, {
              width: colWidth,
              align: 'center',
            })

          doc.fillColor('black')
          currentY += rowHeight

          // Nova página se necessário
          if (currentY > 700) {
            doc.addPage()
            currentY = 50
          }
        }

        // === RESUMO DE FREQUÊNCIA ===
        doc.moveDown(2)

        const resumoY = doc.y
        const boxWidth = 490
        const boxHeight = 80

        // Caixa de resumo
        doc
          .rect(50, resumoY, boxWidth, boxHeight)
          .fillAndStroke('#e8f4f8', '#2E5090')

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('black')
          .text('RESUMO', 50, resumoY + 10, {
            width: boxWidth,
            align: 'center',
          })

        doc.fontSize(11).font('Helvetica')

        doc.text(
          `Total de Aulas: ${dados.totalAulas}`,
          60,
          resumoY + 30,
          {
            continued: true,
          },
        )
        doc.text(`          Presenças: ${dados.totalPresencas}`, {
          continued: true,
        })
        doc.text(`          Faltas: ${dados.totalAulas - dados.totalPresencas}`)

        // Frequência com cor baseada no percentual
        const frequenciaColor =
          dados.percentualFrequencia >= 75 ? 'green' : 'red'

        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .text('Frequência: ', 60, resumoY + 50, {
            continued: true,
          })
          .fillColor(frequenciaColor)
          .text(`${dados.percentualFrequencia.toFixed(2)}%`)

        // Rodapé
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('gray')
          .text(
            `Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
            50,
            750,
            {
              align: 'center',
              width: boxWidth,
            },
          )

        // Finalizar PDF
        doc.on('end', () => resolve())
        doc.on('error', (err) => reject(err))
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}

export default FrequenciaController
