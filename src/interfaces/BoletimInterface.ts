import type { TipoPeriodo } from '@prisma/client'

export interface FiltroBoletimProps {
  idEscola: string
  idAluno: string
  ano: string
  tipoPeriodo: TipoPeriodo
  periodos: string[] // Array de períodos para filtrar (ex: ['1', '2', '3'])
}

export interface NotaDisciplina {
  idDisciplina: string
  nomeDisciplina: string
  notas: number[]
  media: number
}

export interface ComparacaoDesempenho {
  idDisciplina: string
  nomeDisciplina: string
  mediaPeriodoAtual: number
  mediaPeriodoAnterior: number
  diferencaPercentual: number
  situacao: 'melhora' | 'piora' | 'estavel'
}

export interface DadosBoletim {
  nomeEscola: string
  nomeAluno: string
  nomeTurma: string
  ano: string
  tipoPeriodo: TipoPeriodo
  periodosDescricao: string
  disciplinas: NotaDisciplina[]
  comparacoes?: ComparacaoDesempenho[]
  temComparacao: boolean
}
