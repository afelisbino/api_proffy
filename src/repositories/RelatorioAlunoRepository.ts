import type {
  AtualizarRelatorioAlunoProps,
  FiltroRelatorioAlunoProps,
  NovoRelatorioAlunoProps,
} from '../interfaces/RelatorioAlunoInterface'
import { prisma } from '../libraries/PrismaClient'

export async function inserirRelatorioAluno({
  conteudo,
  periodo,
  tipoPeriodo,
  idAluno,
  idProfessor,
}: NovoRelatorioAlunoProps) {
  return await prisma.relatorioAluno.create({
    data: {
      conteudo,
      periodo,
      tipoPeriodo,
      idAluno,
      idProfessor,
    },
  })
}

export async function listarRelatoriosAluno({
  idEscola,
  idTurma,
  idProfessor,
  periodo,
  tipoPeriodo,
}: FiltroRelatorioAlunoProps) {
  return await prisma.relatorioAluno.findMany({
    select: {
      id: true,
      conteudo: true,
      periodo: true,
      tipoPeriodo: true,
      criadoEm: true,
      aluno: {
        select: {
          id: true,
          nome: true,
          ra: true,
          turma: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
      professor: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
    },
    where: {
      aluno: {
        turma: {
          idEscola,
          ...(idTurma && { id: idTurma }),
        },
      },
      ...(idProfessor && { idProfessor }),
      ...(periodo && { periodo }),
      ...(tipoPeriodo && { tipoPeriodo }),
    },
    orderBy: {
      criadoEm: 'desc',
    },
  })
}

export async function atualizarRelatorioAluno({
  id,
  conteudo,
  periodo,
  tipoPeriodo,
}: AtualizarRelatorioAlunoProps) {
  return await prisma.relatorioAluno.update({
    where: {
      id,
    },
    data: {
      conteudo,
      periodo,
      tipoPeriodo,
    },
  })
}

export async function buscarRelatorioParaPDF(
  idRelatorio: string,
  idEscola: string,
) {
  const relatorio = await prisma.relatorioAluno.findFirst({
    where: {
      id: idRelatorio,
      aluno: {
        turma: {
          idEscola,
        },
      },
    },
    select: {
      id: true,
      conteudo: true,
      periodo: true,
      tipoPeriodo: true,
      criadoEm: true,
      aluno: {
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
      },
      professor: {
        select: {
          nome: true,
        },
      },
    },
  })

  if (!relatorio) {
    return null
  }

  return {
    nomeEscola: relatorio.aluno.turma.escola.nome,
    nomeAluno: relatorio.aluno.nome,
    nomeTurma: relatorio.aluno.turma.nome,
    nomeProfessor: relatorio.professor.nome,
    periodo: relatorio.periodo,
    tipoPeriodo: relatorio.tipoPeriodo,
    conteudo: relatorio.conteudo,
    criadoEm: relatorio.criadoEm,
  }
}
