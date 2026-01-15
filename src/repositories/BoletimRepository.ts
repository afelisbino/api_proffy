import type { TipoPeriodo } from '@prisma/client'
import type {
  ComparacaoDesempenho,
  DadosBoletim,
  FiltroBoletimProps,
  NotaDisciplina,
} from '../interfaces/BoletimInterface'
import { prisma } from '../libraries/PrismaClient'

export async function buscarDadosBoletim({
  idEscola,
  idAluno,
  ano,
  tipoPeriodo,
  periodos,
}: FiltroBoletimProps): Promise<DadosBoletim | null> {
  // Buscar dados do aluno com turma e escola
  const aluno = await prisma.aluno.findFirst({
    where: {
      id: idAluno,
      turma: {
        idEscola,
      },
    },
    select: {
      nome: true,
      turma: {
        select: {
          nome: true,
          escola: {
            select: {
              nome: true,
            },
          },
        },
      },
    },
  })

  if (!aluno) {
    return null
  }

  // Buscar todas as notas do período especificado
  const notas = await prisma.notasProvas.findMany({
    where: {
      idAluno,
      ano,
      tipoPeriodo,
      periodo: {
        in: periodos,
      },
    },
    select: {
      nota: true,
      periodo: true,
      disciplina: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
    orderBy: {
      disciplina: {
        nome: 'asc',
      },
    },
  })

  // Agrupar notas por disciplina e calcular médias
  const disciplinasMap = new Map<string, NotaDisciplina>()

  for (const nota of notas) {
    const disciplinaId = nota.disciplina.id
    const notaValor = Number(nota.nota)

    if (!disciplinasMap.has(disciplinaId)) {
      disciplinasMap.set(disciplinaId, {
        idDisciplina: disciplinaId,
        nomeDisciplina: nota.disciplina.nome,
        notas: [],
        media: 0,
      })
    }

    disciplinasMap.get(disciplinaId)?.notas.push(notaValor)
  }

  // Calcular médias
  const disciplinas: NotaDisciplina[] = Array.from(
    disciplinasMap.values(),
  ).map((disciplina) => {
    const soma = disciplina.notas.reduce((acc, nota) => acc + nota, 0)
    disciplina.media =
      disciplina.notas.length > 0 ? soma / disciplina.notas.length : 0
    return disciplina
  })

  // Verificar se deve fazer comparação com período anterior
  const { temComparacao, periodosAnteriores } =
    calcularPeriodosAnteriores(periodos)

  let comparacoes: ComparacaoDesempenho[] | undefined

  if (temComparacao && periodosAnteriores.length > 0) {
    comparacoes = await buscarComparacaoPeriodoAnterior({
      idAluno,
      ano,
      tipoPeriodo,
      periodosAnteriores,
      disciplinasAtuais: disciplinas,
    })
  }

  const periodosDescricao = periodos.sort().join(', ')

  return {
    nomeEscola: aluno.turma.escola.nome,
    nomeAluno: aluno.nome,
    nomeTurma: aluno.turma.nome,
    ano,
    tipoPeriodo,
    periodosDescricao,
    disciplinas,
    comparacoes,
    temComparacao,
  }
}

function calcularPeriodosAnteriores(periodos: string[]): {
  temComparacao: boolean
  periodosAnteriores: string[]
} {
  // Converter para números e ordenar
  const periodosNum = periodos.map(Number).sort((a, b) => a - b)
  const menorPeriodo = periodosNum[0]

  // Se o menor período for 1, não há período anterior para comparar
  if (menorPeriodo === 1) {
    return { temComparacao: false, periodosAnteriores: [] }
  }

  // Calcular períodos anteriores (mesma quantidade de períodos antes)
  const quantidadePeriodos = periodos.length
  const periodosAnteriores: string[] = []

  for (let i = 0; i < quantidadePeriodos; i++) {
    const periodoAnterior = menorPeriodo - quantidadePeriodos + i
    if (periodoAnterior > 0) {
      periodosAnteriores.push(String(periodoAnterior))
    }
  }

  return {
    temComparacao: periodosAnteriores.length > 0,
    periodosAnteriores,
  }
}

async function buscarComparacaoPeriodoAnterior({
  idAluno,
  ano,
  tipoPeriodo,
  periodosAnteriores,
  disciplinasAtuais,
}: {
  idAluno: string
  ano: string
  tipoPeriodo: TipoPeriodo
  periodosAnteriores: string[]
  disciplinasAtuais: NotaDisciplina[]
}): Promise<ComparacaoDesempenho[]> {
  // Buscar notas do período anterior
  const notasAnteriores = await prisma.notasProvas.findMany({
    where: {
      idAluno,
      ano,
      tipoPeriodo,
      periodo: {
        in: periodosAnteriores,
      },
    },
    select: {
      nota: true,
      disciplina: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  })

  // Agrupar e calcular médias do período anterior
  const mediasAnteriores = new Map<string, number>()

  for (const nota of notasAnteriores) {
    const disciplinaId = nota.disciplina.id
    const notaValor = Number(nota.nota)

    if (!mediasAnteriores.has(disciplinaId)) {
      mediasAnteriores.set(disciplinaId, 0)
    }

    const atual = mediasAnteriores.get(disciplinaId) ?? 0
    mediasAnteriores.set(disciplinaId, atual + notaValor)
  }

  // Calcular médias finais do período anterior
  const contagemNotasAnteriores = new Map<string, number>()
  for (const nota of notasAnteriores) {
    const disciplinaId = nota.disciplina.id
    contagemNotasAnteriores.set(
      disciplinaId,
      (contagemNotasAnteriores.get(disciplinaId) || 0) + 1,
    )
  }

  for (const [disciplinaId, soma] of mediasAnteriores.entries()) {
    const contagem = contagemNotasAnteriores.get(disciplinaId) || 1
    mediasAnteriores.set(disciplinaId, soma / contagem)
  }

  // Criar comparações
  const comparacoes: ComparacaoDesempenho[] = []

  for (const disciplina of disciplinasAtuais) {
    const mediaAnterior = mediasAnteriores.get(disciplina.idDisciplina)

    if (mediaAnterior !== undefined && mediaAnterior > 0) {
      const diferencaPercentual =
        ((disciplina.media - mediaAnterior) / mediaAnterior) * 100

      let situacao: 'melhora' | 'piora' | 'estavel'
      if (Math.abs(diferencaPercentual) < 1) {
        situacao = 'estavel'
      } else if (diferencaPercentual > 0) {
        situacao = 'melhora'
      } else {
        situacao = 'piora'
      }

      comparacoes.push({
        idDisciplina: disciplina.idDisciplina,
        nomeDisciplina: disciplina.nomeDisciplina,
        mediaPeriodoAtual: disciplina.media,
        mediaPeriodoAnterior: mediaAnterior,
        diferencaPercentual,
        situacao,
      })
    }
  }

  return comparacoes
}
