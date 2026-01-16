export interface VincularTurmaProfessorProps {
  idTurma: string
  idProfessor: string
}

export interface DesvincularTurmaProfessorProps {
  idTurma: string
  idProfessor: string
}

export interface AtualizarVinculosTurmasProfessorProps {
  idProfessor: string
  idsTurmas: string[] // Lista de IDs das turmas que devem estar vinculadas
}

export interface ListarTurmasProfessorProps {
  idEscola: string
  idUsuarioLogado?: string
  perfilUsuario?: string
  idTurma?: string
}

export interface TurmaProfessorVinculo {
  idTurma: string
  nomeTurma: string
  idProfessor: string
  nomeProfessor: string
  emailProfessor: string
}
