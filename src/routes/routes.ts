import type { FastifyInstance } from 'fastify'

import AuthController from '../controllers/AuthController'
import BoletimController from '../controllers/BoletimController'
import DiarioTurmaController from '../controllers/DiarioTurmaController'
import EscolaController from '../controllers/EscolaController'
import FrequenciaController from '../controllers/FrequenciaController'
import MatriculaAlunoController from '../controllers/MatriculaAlunoController'
import MensagemController from '../controllers/MensagemController'
import RelatorioAlunoController from '../controllers/RelatorioAlunoController'
import ReportBugController from '../controllers/ReportController'
import TurmaController from '../controllers/TurmaController'
import TurmasProfessorController from '../controllers/TurmasProfessorController'

export const routesEscola = (server: FastifyInstance) => {
  const escolaController = new EscolaController()

  server.register(escolaController.criarEscola, {
    prefix: 'escola',
  })

  server.register(escolaController.adicionarUsuarioEscola, {
    prefix: 'escola',
  })

  server.register(escolaController.listarUsuariosEscola, {
    prefix: 'escola',
  })

  server.register(escolaController.alterarStatusUsuario, {
    prefix: 'escola',
  })

  server.register(escolaController.criarModeloMensagem, {
    prefix: 'escola',
  })

  server.register(escolaController.listarModelosMensagemEscola, {
    prefix: 'escola',
  })

  server.register(escolaController.removerModeloMensagem, {
    prefix: 'escola',
  })

  server.register(escolaController.buscarConfiguracoesApiWhatsapp, {
    prefix: 'escola',
  })

  server.register(escolaController.configurarApiWhatsApp, {
    prefix: 'escola',
  })

  server.register(escolaController.novaDisciplina, {
    prefix: 'escola',
  })

  server.register(escolaController.listarDisciplinaEscola, {
    prefix: 'escola',
  })

  server.register(escolaController.removerDisciplina, {
    prefix: 'escola',
  })

  server.register(escolaController.alterarSenhaUsuario, {
    prefix: 'escola',
  })
}

export const routesMensagemWhatsApp = (server: FastifyInstance) => {
  const mensagemController = new MensagemController()

  server.register(mensagemController.enviarMensagemResponsavelAluno, {
    prefix: 'mensagem/whatsapp',
  })

  server.register(mensagemController.buscarMensagensAluno, {
    prefix: 'mensagem/whatsapp',
  })
}

export const routesReportBug = (server: FastifyInstance) => {
  const reportController = new ReportBugController()

  server.register(reportController.reportarBug, {
    prefix: 'reportar',
  })

  server.register(reportController.relatorioEstatisticasEscola, {
    prefix: 'relatorio',
  })

  server.register(reportController.relatorioFrequenciaEscolar, {
    prefix: 'relatorio',
  })

  server.register(reportController.relatorioAvaliacoesAlunos, {
    prefix: 'relatorio',
  })
}

export const routesAuth = (server: FastifyInstance) => {
  const authController = new AuthController()

  server.register(authController.inciarSessao, {
    prefix: 'auth',
  })

  server.register(authController.buscarDadosUsuario, {
    prefix: 'auth',
  })
}

export const routesTurma = (server: FastifyInstance) => {
  const turmaController = new TurmaController()

  server.register(turmaController.criarTurma, {
    prefix: 'turma',
  })

  server.register(turmaController.listarTurmas, {
    prefix: 'turma',
  })

  server.register(turmaController.renomearTurma, {
    prefix: 'turma',
  })

  server.register(turmaController.matricularAlunoTurma, {
    prefix: 'turma',
  })

  server.register(turmaController.transferirAlunosTurma, {
    prefix: 'turma',
  })

  server.register(turmaController.listarAlunosTurma, {
    prefix: 'turma',
  })

  server.register(turmaController.transferirAlunoTurma, {
    prefix: 'turma',
  })

  server.register(turmaController.excluirMatriculaAluno, {
    prefix: 'turma',
  })

  server.register(turmaController.realizarChamadaTurma, {
    prefix: 'turma',
  })

  server.register(turmaController.historicoFrequenciaTurma, {
    prefix: 'turma',
  })

  server.register(turmaController.verificaChamadaRealizadaTurma, {
    prefix: 'chamada'
  })

  server.register(turmaController.alterarPresencaChamada, {
    prefix: 'turma',
  })
}

export const routesDiarioTurma = (server: FastifyInstance) => {
  const diarioTurmaController = new DiarioTurmaController()

  server.register(diarioTurmaController.lancarNotasTurma, {
    prefix: 'diario',
  })

  server.register(diarioTurmaController.buscarLancamentosTurma, {
    prefix: 'diario',
  })

  server.register(diarioTurmaController.alterarNotaAtividade, {
    prefix: 'diario',
  })

  server.register(diarioTurmaController.cadastrarConteudo, {
    prefix: 'diario',
  })

  server.register(diarioTurmaController.removerConteudoAula, {
    prefix: 'diario',
  })

  server.register(diarioTurmaController.listarConteudosAulaTurma, {
    prefix: 'diario',
  })

  server.register(diarioTurmaController.removerAvaliacaoTurma, {
    prefix: 'diario',
  })
}

export const routesMatriculas = (server: FastifyInstance) => {
  const matriculaController = new MatriculaAlunoController()

  server.register(matriculaController.consultarDadosMatriculaAluno, {
    prefix: 'matricula',
  })

  server.register(matriculaController.verificarExisteResponsavel, {
    prefix: 'matricula',
  })

  server.register(matriculaController.alterarStatusBloqueioNotificacao, {
    prefix: 'matricula',
  })

  server.register(matriculaController.excluirContatoTelefonicoResponsavel, {
    prefix: 'matricula',
  })

  server.register(matriculaController.atualizarDadosAluno, {
    prefix: 'matricula',
  })

  server.register(matriculaController.atualizarDadosResponsavel, {
    prefix: 'matricula',
  })

  server.register(matriculaController.vincularNovoResponsavelAluno, {
    prefix: 'matricula',
  })

  server.register(matriculaController.excluirVinculoResponsavelAluno, {
    prefix: 'matricula',
  })

  server.register(matriculaController.adicionarNovosContatos, {
    prefix: 'matricula',
  })

  server.register(matriculaController.atualizarPermissaoNotificacaoContato, {
    prefix: 'matricula',
  })
}

export const routesRelatorioAluno = (server: FastifyInstance) => {
  const relatorioController = new RelatorioAlunoController()

  server.register(relatorioController.listarRelatorios, {
    prefix: 'relatorio-aluno',
  })

  server.register(relatorioController.cadastrarRelatorio, {
    prefix: 'relatorio-aluno',
  })

  server.register(relatorioController.editarRelatorio, {
    prefix: 'relatorio-aluno',
  })

  server.register(relatorioController.gerarRelatorioPDF, {
    prefix: 'relatorio-aluno',
  })
}

export const routesFrequencia = (server: FastifyInstance) => {
  const frequenciaController = new FrequenciaController()

  server.register(frequenciaController.gerarRelatorioFrequencia, {
    prefix: 'frequencia',
  })
}

export const routesBoletim = (server: FastifyInstance) => {
  const boletimController = new BoletimController()

  server.register(boletimController.gerarBoletim, {
    prefix: 'boletim',
  })
}

export const routesTurmasProfessor = (server: FastifyInstance) => {
  const turmasProfessorController = new TurmasProfessorController()

  server.register(turmasProfessorController.minhasTurmas, {
    prefix: 'turmas-professor',
  })

  server.register(turmasProfessorController.listarVinculos, {
    prefix: 'turmas-professor',
  })

  server.register(turmasProfessorController.vincularTurma, {
    prefix: 'turmas-professor',
  })

  server.register(turmasProfessorController.desvincularTurma, {
    prefix: 'turmas-professor',
  })

  server.register(turmasProfessorController.atualizarVinculos, {
    prefix: 'turmas-professor',
  })
}
