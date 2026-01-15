import type { TipoPeriodo } from '@prisma/client'

export interface NovoRelatorioAlunoProps {
  conteudo: string
  periodo: string
  tipoPeriodo: TipoPeriodo
  idAluno: string
  idProfessor: string
}

export interface AtualizarRelatorioAlunoProps {
  id: string
  conteudo: string
  periodo: string
  tipoPeriodo: TipoPeriodo
}

export interface FiltroRelatorioAlunoProps {
  idEscola: string
  idTurma?: string
  idProfessor?: string
  periodo?: string
  tipoPeriodo?: TipoPeriodo
}
