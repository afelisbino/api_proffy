import type {
  DadosRelatorioFrequencia,
  FiltroRelatorioFrequenciaProps,
} from '../interfaces/FrequenciaInterface'
import { prisma } from '../libraries/PrismaClient'

export async function buscarDadosRelatorioFrequencia({
  idEscola,
  idAluno,
  dataInicio,
  dataFim,
}: FiltroRelatorioFrequenciaProps): Promise<DadosRelatorioFrequencia | null> {
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

  // Buscar todas as chamadas do período
  const chamadas = await prisma.chamadaTurma.findMany({
    where: {
      idAluno,
      dataChamada: {
        gte: dataInicio,
        lte: dataFim,
      },
    },
    select: {
      dataChamada: true,
      presenca: true,
    },
    orderBy: {
      dataChamada: 'asc',
    },
  })

  const totalAulas = chamadas.length
  const totalPresencas = chamadas.filter((c) => c.presenca).length
  const percentualFrequencia =
    totalAulas > 0 ? (totalPresencas / totalAulas) * 100 : 0

  return {
    nomeEscola: aluno.turma.escola.nome,
    nomeAluno: aluno.nome,
    nomeTurma: aluno.turma.nome,
    dataInicio,
    dataFim,
    chamadas,
    totalAulas,
    totalPresencas,
    percentualFrequencia,
  }
}
