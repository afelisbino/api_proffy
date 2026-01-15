import type { InserirUsuarioEscolaProps } from '../interfaces/EscolaInterface'
import type { AlterarSenhaUsuarioProps, ValidarCredenciaisUsuarioProps } from '../interfaces/UsuarioInterface'
import { prisma } from '../libraries/PrismaClient'
import { validarSenhaCriptografada } from '../utils/Bcrypt'

export async function validarCredenciaisUsuario({
  email,
  senha,
}: ValidarCredenciaisUsuarioProps) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      email,
      status: true,
    },
  })

  if (usuario) {
    await validarSenhaCriptografada(senha, usuario?.senha)

    return usuario
  }

  return null
}

export async function inserirUsuarioEscola({
  nome,
  email,
  senha,
  status,
  perfil,
  idEscola,
}: InserirUsuarioEscolaProps) {
  return await prisma.usuario.create({
    data: {
      nome,
      email,
      senha,
      status,
      perfil,
      idEscola,
    },
  })
}

export async function listarUsuariosEscola(idEscola: string, perfil?: string) {
  return await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      status: true,
      perfil: true,
    },
    where: {
      idEscola,
      ...(perfil && { perfil }),
    },
  })
}

export async function consultarUsuario(idUsuario: string) {
  return await prisma.usuario.findUnique({
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
    },
    where: {
      id: idUsuario,
    },
  })
}

export async function modificarStatus(
  idUsuario: string,
  idEscola: string,
  status: boolean
) {
  return await prisma.usuario.update({
    select: {
      id: true,
      nome: true,
      email: true,
      status: true,
    },
    where: {
      id: idUsuario,
      idEscola
    },
    data: {
      status,
    },
  })
}

export async function modificarSenhaUsuario({ id, idEscola, senha }: AlterarSenhaUsuarioProps) {
  return await prisma.usuario.update({
    where: {
      id,
      idEscola
    },
    data: {
      senha
    }
  })
}