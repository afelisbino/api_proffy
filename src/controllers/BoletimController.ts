import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import PDFDocument from 'pdfkit'
import { z } from 'zod'

import type { DadosBoletim } from '../interfaces/BoletimInterface'
import { buscarDadosBoletim } from '../repositories/BoletimRepository'

class BoletimController {
  async gerarBoletim(app: FastifyInstance) {
    const querySchema = z.object({
      idAluno: z.string().uuid('ID do aluno inválido'),
      ano: z.string().length(4, 'Ano deve ter 4 dígitos'),
      tipoPeriodo: z.enum(['mensal', 'bimestral', 'trimestral', 'semestral']),
      periodos: z.string().min(1, 'Períodos é obrigatório'), // Ex: "1,2,3"
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

        // Converter string de períodos em array
        const periodosArray = filtros.periodos
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0)

        if (periodosArray.length === 0) {
          return res.status(400).send({
            mensagem: 'Informe pelo menos um período válido',
          })
        }

        const dados = await buscarDadosBoletim({
          idEscola,
          idAluno: filtros.idAluno,
          ano: filtros.ano,
          tipoPeriodo: filtros.tipoPeriodo,
          periodos: periodosArray,
        })

        if (!dados) {
          return res.status(404).send({
            mensagem: 'Aluno não encontrado',
          })
        }

        if (dados.disciplinas.length === 0) {
          return res.status(404).send({
            mensagem: 'Nenhuma nota encontrada para o período especificado',
          })
        }

        // Gerar PDF
        return BoletimController.gerarPDF(dados, req, res)
      } catch (error) {
        console.error('❌ Erro ao gerar boletim:', error)
        return res.status(400).send({
          mensagem: 'Erro ao gerar boletim',
          erro: error instanceof Error ? error.message : String(error),
        })
      }
    })
  }

  private static gerarPDF(dados: DadosBoletim, req: FastifyRequest, res: FastifyReply) {
    return new Promise<void>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: 'Boletim Escolar',
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
          `attachment; filename="boletim-${dados.nomeAluno.replace(/\s+/g, '-')}.pdf"`
        )

        // Pipe do PDF para a resposta
        doc.pipe(res.raw)

        // === TÍTULO DO BOLETIM ===
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(dados.nomeEscola.toUpperCase(), { align: 'center' })
          .moveDown(0.5)

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('BOLETIM ESCOLAR', { align: 'center' })
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

        doc
          .font('Helvetica-Bold')
          .text('Ano Letivo: ', 50, doc.y + 5, { continued: true })
          .font('Helvetica')
          .text(dados.ano)

        const tipoPeriodoLabel = {
          mensal: 'Mensal',
          bimestral: 'Bimestral',
          trimestral: 'Trimestral',
          semestral: 'Semestral',
        }[dados.tipoPeriodo]

        doc
          .font('Helvetica-Bold')
          .text('Período: ', 50, doc.y + 5, { continued: true })
          .font('Helvetica')
          .text(`${tipoPeriodoLabel} - ${dados.periodosDescricao}`)

        doc.moveDown(1.5)

        // === TABELA DE NOTAS ===
        const tableTop = doc.y
        const col1Width = 300 // Disciplina
        const col2Width = 90 // Média
        const col3Width = 100 // Análise (se houver)
        const hasComparacao = dados.temComparacao && dados.comparacoes

        const rowHeight = 30

        // Cabeçalho da tabela
        doc
          .rect(50, tableTop, col1Width, rowHeight)
          .fillAndStroke('#2E5090', '#2E5090')

        doc
          .rect(50 + col1Width, tableTop, col2Width, rowHeight)
          .fillAndStroke('#2E5090', '#2E5090')

        if (hasComparacao) {
          doc
            .rect(50 + col1Width + col2Width, tableTop, col3Width, rowHeight)
            .fillAndStroke('#2E5090', '#2E5090')
        }

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('white')
          .text('DISCIPLINA', 50, tableTop + 10, {
            width: col1Width,
            align: 'center',
          })
          .text('MÉDIA', 50 + col1Width, tableTop + 10, {
            width: col2Width,
            align: 'center',
          })

        if (hasComparacao) {
          doc.text('ANÁLISE', 50 + col1Width + col2Width, tableTop + 10, {
            width: col3Width,
            align: 'center',
          })
        }

        doc.fillColor('black')

        // Criar mapa de comparações para acesso rápido
        const comparacoesMap = new Map(
          dados.comparacoes?.map((c) => [c.idDisciplina, c]),
        )

        // Linhas da tabela
        let currentY = tableTop + rowHeight

        for (let i = 0; i < dados.disciplinas.length; i++) {
          const disciplina = dados.disciplinas[i]
          const bgColor = i % 2 === 0 ? '#f0f0f0' : 'white'

          const totalWidth = hasComparacao
            ? col1Width + col2Width + col3Width
            : col1Width + col2Width

          // Background zebrado
          doc
            .rect(50, currentY, totalWidth, rowHeight)
            .fillAndStroke(bgColor, 'gray')

          // Disciplina
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('black')
            .text(disciplina.nomeDisciplina, 60, currentY + 10, {
              width: col1Width - 20,
              align: 'left',
            })

          // Média
          const mediaTexto = disciplina.media.toFixed(2)
          const mediaColor = disciplina.media >= 6 ? 'green' : 'red'

          doc
            .font('Helvetica-Bold')
            .fillColor(mediaColor)
            .text(mediaTexto, 50 + col1Width, currentY + 10, {
              width: col2Width,
              align: 'center',
            })

          // Análise (se houver comparação)
          if (hasComparacao) {
            const comparacao = comparacoesMap.get(disciplina.idDisciplina)

            if (comparacao) {
              const percentualTexto = `${comparacao.diferencaPercentual > 0 ? '+' : ''}${comparacao.diferencaPercentual.toFixed(1)}%`

              let analiseColor = 'gray'
              let simbolo = '='

              if (comparacao.situacao === 'melhora') {
                analiseColor = 'green'
                simbolo = '↑'
              } else if (comparacao.situacao === 'piora') {
                analiseColor = 'red'
                simbolo = '↓'
              }

              doc
                .font('Helvetica-Bold')
                .fillColor(analiseColor)
                .text(
                  `${simbolo} ${percentualTexto}`,
                  50 + col1Width + col2Width,
                  currentY + 10,
                  {
                    width: col3Width,
                    align: 'center',
                  },
                )
            }
          }

          doc.fillColor('black')
          currentY += rowHeight

          // Nova página se necessário
          if (currentY > 700) {
            doc.addPage()
            currentY = 50
          }
        }

        // === LEGENDA (se houver comparação) ===
        if (hasComparacao) {
          doc.moveDown(2)

          const legendaY = doc.y
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('black')
            .text('LEGENDA DA ANÁLISE:', 50, legendaY)
            .moveDown(0.5)

          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('green')
            .text('↑ Melhora: ', 60, doc.y, { continued: true })
            .fillColor('black')
            .text('Desempenho superior ao período anterior')

          doc
            .fillColor('red')
            .text('↓ Piora: ', 60, doc.y + 3, { continued: true })
            .fillColor('black')
            .text('Desempenho inferior ao período anterior')

          doc
            .fillColor('gray')
            .text('= Estável: ', 60, doc.y + 3, { continued: true })
            .fillColor('black')
            .text('Desempenho similar ao período anterior')
        }

        // === RESUMO GERAL ===
        doc.moveDown(2)

        const resumoY = doc.y
        const boxWidth = 490
        const boxHeight = 60

        // Caixa de resumo
        doc
          .rect(50, resumoY, boxWidth, boxHeight)
          .fillAndStroke('#e8f4f8', '#2E5090')

        const somaMedias = dados.disciplinas.reduce(
          (acc, d) => acc + d.media,
          0,
        )
        const mediaGeral =
          dados.disciplinas.length > 0
            ? somaMedias / dados.disciplinas.length
            : 0

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('black')
          .text('RESUMO GERAL', 50, resumoY + 10, {
            width: boxWidth,
            align: 'center',
          })

        doc
          .fontSize(11)
          .font('Helvetica')
          .text(
            `Total de Disciplinas: ${dados.disciplinas.length}`,
            60,
            resumoY + 35,
            {
              continued: true,
            },
          )

        const mediaGeralColor = mediaGeral >= 6 ? 'green' : 'red'

        doc
          .text('          Média Geral: ', { continued: true })
          .font('Helvetica-Bold')
          .fillColor(mediaGeralColor)
          .text(mediaGeral.toFixed(2))

        // Rodapé
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('gray')
          .text(
            'Boletim gerado pelo Sistema Proffy',
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

export default BoletimController
