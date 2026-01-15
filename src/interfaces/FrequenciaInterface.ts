export interface FiltroRelatorioFrequenciaProps {
  idEscola: string
  idAluno: string
  dataInicio: Date
  dataFim: Date
}

export interface DadosChamadaAluno {
  dataChamada: Date
  presenca: boolean
}

export interface DadosRelatorioFrequencia {
  nomeEscola: string
  nomeAluno: string
  nomeTurma: string
  dataInicio: Date
  dataFim: Date
  chamadas: DadosChamadaAluno[]
  totalAulas: number
  totalPresencas: number
  percentualFrequencia: number
}
