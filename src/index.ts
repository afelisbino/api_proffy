import {
  routesAuth,
  routesBoletim,
  routesDiarioTurma,
  routesEscola,
  routesFrequencia,
  routesMatriculas,
  routesMensagemWhatsApp,
  routesRelatorioAluno,
  routesReportBug,
  routesTurma,
  routesTurmasProfessor,
} from './routes/routes'
import Servidor from './server/Servidor'

const server = new Servidor(
  process.env.ENV_HOST_SERVER || '0.0.0.0',
  Number(process.env.ENV_PORT_SERVER) || 3333,
)

routesEscola(server.getServico())
routesMensagemWhatsApp(server.getServico())
routesAuth(server.getServico())
routesTurma(server.getServico())
routesReportBug(server.getServico())
routesDiarioTurma(server.getServico())
routesMatriculas(server.getServico())
routesRelatorioAluno(server.getServico())
routesFrequencia(server.getServico())
routesBoletim(server.getServico())
routesTurmasProfessor(server.getServico())

server.inicializar()
