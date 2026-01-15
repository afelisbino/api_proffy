import type { Prisma } from '@prisma/client'
import type {
  AtualizarVinculosTurmasProfessorProps,
  DesvincularTurmaProfessorProps,
  ListarTurmasProfessorProps,
  TurmaProfessorVinculo,
  VincularTurmaProfessorProps,
} from '../interfaces/TurmasProfessorInterface'
import { prisma } from '../libraries/PrismaClient'

export async function vincularTurmaProfessor({
  idTurma,
  idProfessor,
}: VincularTurmaProfessorProps) {
  // Verificar se o vínculo já existe
  const vinculoExistente = await prisma.turmasProfessor.findFirst({
    where: {
      idTurma,
      idProfessor,
    },
  })

  if (vinculoExistente) {
    throw new Error('Vínculo já existe')
  }

  return await prisma.turmasProfessor.create({
    data: {
      idTurma,
      idProfessor,
    },
    select: {
      id: true,
      turma: {
        select: {
          id: true,
          nome: true,
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
  })
}

export async function desvincularTurmaProfessor({
  idTurma,
  idProfessor,
}: DesvincularTurmaProfessorProps) {
  // Buscar o vínculo
  const vinculo = await prisma.turmasProfessor.findFirst({
    where: {
      idTurma,
      idProfessor,
    },
  })

  if (!vinculo) {
    throw new Error('Vínculo não encontrado')
  }

  return await prisma.turmasProfessor.delete({
    where: {
      id: vinculo.id,
    },
  })
}

export async function listarTurmasProfessor({
  idEscola,
  idUsuarioLogado,
  perfilUsuario,
  idTurma,
}: ListarTurmasProfessorProps): Promise<TurmaProfessorVinculo[]> {
  // Se o perfil for PROFESSOR, filtrar apenas turmas vinculadas ao usuário logado

  const whereClause: Prisma.TurmasProfessorWhereInput = {
    turma: {
      idEscola,
      ...(idTurma && { id: idTurma }),
    },
  }

  if (perfilUsuario === 'PROFESSOR') {
    whereClause.idProfessor = idUsuarioLogado
  }

  const vinculos = await prisma.turmasProfessor.findMany({
    where: whereClause,
    select: {
      id: true,
      idTurma: true,
      turma: {
        select: {
          nome: true,
        },
      },
      idProfessor: true,
      professor: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
    orderBy: [
      {
        turma: {
          nome: 'asc',
        },
      },
      {
        professor: {
          nome: 'asc',
        },
      },
    ],
  })

  return vinculos.map(v => ({
    id: v.id,
    idTurma: v.idTurma,
    nomeTurma: v.turma.nome,
    idProfessor: v.idProfessor,
    nomeProfessor: v.professor.nome,
    emailProfessor: v.professor.email,
  }))
}

/**
 * Função inteligente para atualizar vínculos de turmas de um professor
 *
 * Esta função compara a lista atual de turmas vinculadas ao professor
 * com a lista desejada e realiza automaticamente:
 * - Adiciona novos vínculos (turmas que não estavam vinculadas)
 * - Remove vínculos antigos (turmas que não estão mais na lista)
 * - Mantém vínculos existentes que continuam válidos
 *
 * @param idProfessor - ID do professor
 * @param idsTurmas - Array com IDs das turmas que DEVEM estar vinculadas
 * @returns Objeto com estatísticas da operação
 */
export async function atualizarVinculosTurmasProfessor({
  idProfessor,
  idsTurmas,
}: AtualizarVinculosTurmasProfessorProps) {
  // 1. Buscar vínculos atuais do professor
  const vinculosAtuais = await prisma.turmasProfessor.findMany({
    where: {
      idProfessor,
    },
    select: {
      id: true,
      idTurma: true,
    },
  })

  // 2. Criar Sets para comparação eficiente
  const turmasAtuaisSet = new Set(vinculosAtuais.map(v => v.idTurma))
  const turmasDesejadasSet = new Set(idsTurmas)

  // 3. Identificar turmas a adicionar (estão na lista desejada mas não estão vinculadas)
  const turmasParaAdicionar = idsTurmas.filter(
    idTurma => !turmasAtuaisSet.has(idTurma)
  )

  // 4. Identificar turmas a remover (estão vinculadas mas não estão na lista desejada)
  const vinculosParaRemover = vinculosAtuais.filter(
    v => !turmasDesejadasSet.has(v.idTurma)
  )

  // 5. Identificar turmas mantidas (estão em ambas as listas)
  const turmasMantidas = vinculosAtuais.filter(v =>
    turmasDesejadasSet.has(v.idTurma)
  )

  // 6. Executar operações em transação
  const resultado = await prisma.$transaction(async tx => {
    // Remover vínculos antigos
    const removidos = await Promise.all(
      vinculosParaRemover.map(vinculo =>
        tx.turmasProfessor.delete({
          where: {
            id: vinculo.id,
          },
        })
      )
    )

    // Adicionar novos vínculos
    const adicionados = await Promise.all(
      turmasParaAdicionar.map(idTurma =>
        tx.turmasProfessor.create({
          data: {
            idTurma,
            idProfessor,
          },
          select: {
            id: true,
            turma: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        })
      )
    )

    return {
      adicionados,
      removidos,
      mantidos: turmasMantidas.length,
    }
  })

  // 7. Retornar estatísticas da operação
  return {
    totalAdicionados: resultado.adicionados.length,
    totalRemovidos: resultado.removidos.length,
    totalMantidos: resultado.mantidos,
    totalVinculos: idsTurmas.length,
    turmasAdicionadas: resultado.adicionados.map(v => ({
      id: v.turma.id,
      nome: v.turma.nome,
    })),
  }
}
