import type { Prisma } from '@prisma/client'
import { prisma } from '../../src/libraries/PrismaClient'
import { criptografarSenha } from '../../src/utils/Bcrypt'

const usuariosEscola: Prisma.UsuarioCreateInput[] = [
  {
    nome: 'Adriano Silva',
    email: 'adriano@dev.com',
    senha: criptografarSenha('mudar@123'),
    escola: {
      connect: { id: '00c99ee1-eccf-4d71-88fa-2e1d2c085867' },
    },
  },
  {
    nome: 'Diretor Escola',
    email: 'diretor@dev.com',
    perfil: 'ADMIN',
    senha: criptografarSenha('mudar@123'),
    escola: {
      connect: { id: '00c99ee1-eccf-4d71-88fa-2e1d2c085867' },
    },
  },
]

async function seed() {
  const criaEscola = prisma.escola.upsert({
    where: { id: '00c99ee1-eccf-4d71-88fa-2e1d2c085867' },
    update: { nome: 'Escola de Teste' },
    create: {
      id: '00c99ee1-eccf-4d71-88fa-2e1d2c085867',
      nome: 'Escola de Teste',
    },
  })

  const criaUsuariosEscola = usuariosEscola.map(usuarioEscola =>
    prisma.usuario.upsert({
      where: { email: usuarioEscola.email },
      update: usuarioEscola,
      create: usuarioEscola,
    })
  )

  const criaDisciplinas = prisma.disciplina.createMany({
    data: [
      {
        nome: 'Matemática',
        idEscola: '00c99ee1-eccf-4d71-88fa-2e1d2c085867',
      },
      {
        nome: 'Português',
        idEscola: '00c99ee1-eccf-4d71-88fa-2e1d2c085867',
      },
    ],
  })

  await prisma.$transaction([
    criaEscola,
    criaDisciplinas,
    ...criaUsuariosEscola,
  ])
}

seed()
  .catch(error => {
    console.error('Erro ao executar seed:', error)
    process.exit(1)
  })
  .then(() => {
    console.log('Seed realizado com sucesso!')
  })
