# Proffy API - Instruções para Agentes de IA

Sistema de gerenciamento escolar com diário de turma, mensageria via WhatsApp e relatórios.

## Arquitetura

**Stack**: Node.js 20 + Fastify + Prisma ORM + MySQL + TypeScript (ESM)
**Estrutura**: Repositório pattern com controllers registrados no Fastify via funções modulares

### Fluxo de Dados
1. `src/index.ts` → Inicializa servidor Fastify e registra routes
2. Routes (`src/routes/routes.ts`) → Funções exportadas que registram controllers com prefixos
3. Controllers → Métodos que registram handlers no Fastify (`app.post('/rota', async (req, reply) => {...})`)
4. Repositories → Acesso ao banco via `prisma` (importado de `src/libraries/PrismaClient.ts`)
5. Services → Lógica de negócio (ex: `MensageriaService` para WhatsApp)

**Autenticação**: Cookies (`session-user`, `session-company`) via `@fastify/cookie`
- `session-company` contém `idEscola` (contexto multi-tenant)
- Cookies acessados via `req.cookies['session-company']`

## Padrões do Projeto

### Controllers
- Classe com métodos assíncronos que registram rotas: `async nomeDaRota(app: FastifyInstance)`
- Validação com Zod: `const bodySchema = z.object({...}); await bodySchema.parseAsync(req.body)`
- Sempre validar autenticação via `req.cookies['session-company']` no início de cada método
- Retornar status HTTP apropriados:
  - `401` para não autorizado
  - `400` para erros de validação
  - `201` para criação bem-sucedida
  - `200` para operações de leitura/atualização
- Validação de query params para rotas GET com filtros: `z.object({...}).optional()`
- Exemplo: [AuthController.ts](src/controllers/AuthController.ts#L9-L48)

### Repositories
- Funções exportadas que retornam Promises
- Importam `prisma` de `src/libraries/PrismaClient.ts`
- Nomenclatura: `inserir*`, `buscar*`, `listar*`, `remover*`, `atualizar*`
- Use `select` para especificar campos retornados e otimizar queries
- Use `where` com filtros condicionais: `...(campo && { campo })`
- Use `orderBy` para ordenação consistente (geralmente por data de criação/atualização)
- Inclua relacionamentos necessários com `select` aninhado
- **Funções inteligentes**: Para relacionamentos N:N, implemente funções que comparam estado atual vs desejado e aplicam mudanças automaticamente (adicionar/remover)
  - Exemplo: `atualizarVinculosTurmasProfessor()` - atualiza vínculos de forma inteligente usando transações

### Interfaces
- Criar arquivo em `src/interfaces/` com sufixo `Interface.ts`
- Definir tipos para:
  - `Novo*Props` - Dados para criação
  - `Atualizar*Props` - Dados para atualização
  - `Filtro*Props` - Parâmetros de filtro (sempre incluir `idEscola`)
- Importar tipos do Prisma quando necessário: `import type { TipoEnum } from '@prisma/client'`

### Organização de Rotas
```typescript
// src/routes/routes.ts
export const routesEscola = (server: FastifyInstance) => {
  const controller = new EscolaController()
  server.register(controller.criarEscola, { prefix: 'escola' })
}
```

### Checklist para Criar Nova Funcionalidade

Ao criar novas rotas/funcionalidades, seguir esta ordem:

1. **Interface** (`src/interfaces/*Interface.ts`)
   - Definir tipos: `Novo*Props`, `Atualizar*Props`, `Filtro*Props`
   - Importar enums do Prisma se necessário

2. **Repository** (`src/repositories/*Repository.ts`)
   - Funções: `inserir*`, `listar*`, `atualizar*`, `remover*`
   - Usar `select` para campos específicos
   - Aplicar filtros condicionais multi-tenant

3. **Controller** (`src/controllers/*Controller.ts`)
   - Classe com métodos assíncronos
   - Validação Zod para body/query
   - Verificar autenticação via cookie
   - Chamadas aos repositories

4. **Rotas** (`src/routes/routes.ts`)
   - Criar função `routes*` exportada
   - Instanciar controller
   - Registrar métodos com `server.register()`

5. **Registro** (`src/index.ts`)
   - Importar função de rotas
   - Chamar função com `server.getServico()`

### Modelo de Dados
- Multi-tenant: Entidades principais têm `idEscola` (FK para `Escola`)
- Hierarquia: `Escola` → `Turma` → `Aluno` + `Usuario`
- Relacionamento N:N: `ResponsavelAluno` conecta `Responsavel` e `Aluno`
- Schema completo em [prisma/schema.prisma](prisma/schema.prisma)

## Comandos de Desenvolvimento

```bash
pnpm dev                    # Servidor local com hot-reload (tsx watch)
pnpm build                  # Build para produção (tsup)
pnpm start                  # Executa build de produção

# Prisma
npx prisma migrate dev      # Cria e aplica migrations (dev)
npx prisma generate         # Gera Prisma Client
npx prisma db seed          # Popula banco (prisma/seeds/dev.ts)
npx prisma studio           # UI para visualizar dados

# Docker
docker compose up -d        # Sobe MySQL (porta 3306)
```

## Configuração

**Variáveis de ambiente obrigatórias**:
- `DATABASE_URL`: Connection string MySQL (ex: `mysql://root:passw0rd@localhost:3306/api`)
- `COOKIE_SECRET`: Secret para assinar cookies
- `DOMAIN`: Domínio para cookies (ex: `.proffy.manstock.com.br`)
- `ENV_HOST_SERVER` / `ENV_PORT_SERVER`: Host/porta do servidor (padrão: `0.0.0.0:3333`)
- `NODE_ENV`: `production` para CORS restrito

## Convenções de Código

- **Formatação**: Biome (single quotes, no semicolons, trailing commas ES5)
- **Tipos**: Interfaces em `src/interfaces/` terminam com `Interface` ou `Props`
- **Imports**: ESM (`import`/`export`), organize-imports habilitado
- **Nomenclatura**: camelCase para variáveis/funções, PascalCase para classes

## 🔴 REGRA OBRIGATÓRIA: Uso do Context7

**EM TODAS AS SOLICITAÇÕES DE CÓDIGO, CONSULTE PRIMEIRO A DOCUMENTAÇÃO VIA Context7**

Antes de implementar, corrigir ou sugerir qualquer código relacionado a bibliotecas/frameworks deste projeto, você DEVE:

1. **Consultar a documentação atualizada** usando `#upstash/context7`
2. **Usar a sintaxe correta** das versões instaladas no projeto
3. **Seguir as melhores práticas** documentadas oficialmente

### Exemplos de Uso Obrigatório:

**Fastify (v4.27)**:
```
#upstash/context7 como usar cookies no Fastify
#upstash/context7 validação de request body no Fastify
#upstash/context7 como registrar rotas com prefixo no Fastify
```

**Prisma (v6.5)**:
```
#upstash/context7 query com Prisma para relacionamentos N:N
#upstash/context7 como fazer transações no Prisma
#upstash/context7 Prisma findMany com filtros complexos
```

**Zod (v3.23)**:
```
#upstash/context7 validação de arrays com Zod
#upstash/context7 schemas opcionais no Zod
#upstash/context7 transformações com Zod
```

**date-fns (v4.1)**:
```
#upstash/context7 formatar data em português com date-fns
#upstash/context7 calcular diferença entre datas com date-fns
```

**Outras bibliotecas do projeto**:
```
#upstash/context7 axios interceptors
#upstash/context7 bcrypt hash e compare
#upstash/context7 pdfkit create PDF tables
```

### 🚨 NÃO ASSUMA SINTAXES OU APIs SEM CONSULTAR

- ❌ **Errado**: Implementar código baseado em conhecimento geral ou versões antigas
- ✅ **Correto**: Consultar Context7, obter sintaxe exata, implementar com confiança

Isso garante código atualizado, sem erros de sintaxe e compatível com as versões exatas instaladas no projeto.

## Integrações

### WhatsApp
- Abstração via `WhatsappService` (base class) em `src/services/whatsapp/`
- Implementações específicas: `WhatsAppChatPro`, `WhatsappApiBrasil`
- Credenciais armazenadas em `Configuracoes` (vinculado a `idEscola`)
- Uso: `MensageriaService` orquestra envio e registra em `NotificacaoResponsavelAluno`

### Geração de PDFs
- Biblioteca: **PDFKit** (v0.17.2) - Gera documentos PDF complexos com Node.js
- Instalação: `pnpm add pdfkit @types/pdfkit`
- Uso: Stream do PDF para `FastifyReply.raw` com headers apropriados
- Exemplo de implementação: `FrequenciaController.gerarRelatorioFrequencia()`

**🔴 PADRÃO OBRIGATÓRIO PARA PDFs COM CORS**:

```typescript
// 1. MÉTODO PÚBLICO: Validação e busca de dados
async gerarRelatorioPDF(app: FastifyInstance) {
  const querySchema = z.object({ id: z.string().uuid() })
  
  app.get('/gerar-pdf', async (req, res) => {
    // Validar autenticação
    const idEscola = req.cookies['session-company']
    if (!idEscola) return res.status(401).send({ mensagem: 'Não autorizado' })
    
    try {
      const { id } = await querySchema.parseAsync(req.query)
      const dados = await buscarDadosParaPDF(id, idEscola)
      
      if (!dados) return res.status(404).send({ mensagem: 'Não encontrado' })
      
      // Chamar método estático passando req e res
      return NomeDoController.gerarPDF(dados, req, res)
    } catch (error) {
      console.error('❌ Erro:', error)
      return res.status(400).send({
        mensagem: 'Erro ao gerar PDF',
        erro: error instanceof Error ? error.message : String(error)
      })
    }
  })
}

// 2. MÉTODO ESTÁTICO PRIVADO: Geração do PDF
private static gerarPDF(
  dados: TipoDados,
  req: FastifyRequest,  // ⚠️ OBRIGATÓRIO para CORS
  res: FastifyReply
) {
  // ⚠️ Envolver em Promise para aguardar finalização do stream
  return new Promise<void>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: { Title: 'Relatório', Author: dados.nomeEscola }
      })

      // ⚠️ CRÍTICO: Usar res.raw.setHeader (NÃO res.header)
      // Headers de CORS (obrigatórios para funcionamento do frontend)
      res.raw.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
      res.raw.setHeader('Access-Control-Allow-Credentials', 'true')
      res.raw.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
      
      // Headers do PDF
      res.raw.setHeader('Content-Type', 'application/pdf')
      res.raw.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-${dados.nomeAluno.replace(/\s+/g, '-')}.pdf"`
      )

      // Pipe para resposta HTTP
      doc.pipe(res.raw)

      // === Conteúdo do PDF ===
      doc.fontSize(18).font('Helvetica-Bold')
        .text('TÍTULO', { align: 'center' })
      
      // ... adicionar conteúdo ...

      // ⚠️ CRÍTICO: Handlers de eventos para resolver a Promise
      doc.on('end', () => {
        console.log('✅ PDF finalizado com sucesso!')
        resolve()
      })
      doc.on('error', (err) => {
        console.error('❌ Erro no stream do PDF:', err)
        reject(err)
      })
      
      // Finalizar documento
      doc.end()
    } catch (error) {
      console.error('❌ Erro ao construir PDF:', error)
      reject(error)
    }
  })
}
```

**⚠️ Checklist Crítico para PDFs**:
1. ✅ Método `gerarPDF` deve ser **estático** (`private static`)
2. ✅ Deve receber `req: FastifyRequest` como parâmetro (para CORS)
3. ✅ Envolver em `Promise<void>` com handlers `doc.on('end')` e `doc.on('error')`
4. ✅ Usar `res.raw.setHeader()` (NÃO `res.header()`)
5. ✅ Configurar headers CORS antes do pipe: `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Expose-Headers`
6. ✅ No `Servidor.ts`, adicionar `exposedHeaders: ['Content-Disposition']` na configuração de CORS

**Recursos do PDFKit**:
- Fontes: `doc.font('Helvetica-Bold')` ou `doc.font('Helvetica')`
- Tamanhos: `doc.fontSize(14)`
- Cores: `doc.fillColor('red')` ou `doc.fillColor('#2E5090')`
- Tabelas: Criar manualmente com `doc.rect()` e `doc.text()`
- Formatação de datas: Usar `date-fns` para formatar antes de inserir no PDF
- Quebra de página: Verificar `doc.y` e chamar `doc.addPage()` quando necessário

**Padrão para relatórios comparativos**:
- Calcular médias e agregações no repository
- Implementar lógica de comparação de períodos no repository
- Buscar dados de períodos anteriores para análise de evolução
- Usar cores visuais para indicar melhora (verde), piora (vermelho) ou estabilidade (cinza)
- Exemplo: `BoletimController.gerarBoletim()` - compara médias de períodos consecutivos

### Relatórios
- Controllers: `ReportController` → `ReportSistema` (bugs) + relatórios estatísticos
- Queries complexas em `RelatorioRepository` e `ReportSistemaRepository`
- PDFs de frequência: `FrequenciaController` (chamadas + percentual de presença)
- PDFs de boletim: `BoletimController` (médias por disciplina + análise comparativa)

## Casos de Uso Principais

1. **Diário de Turma**: Lançamento de notas (`NotasProvas`), conteúdos de aula (`ConteudoAulaTurma`), chamadas (`ChamadaTurma`)
2. **Mensageria**: Envio automático de notificações para responsáveis via WhatsApp
3. **Matrículas**: CRUD de alunos, responsáveis e vínculos (`ResponsavelAluno`)
4. **Vínculos Turmas-Professor**: Gerenciamento inteligente de relacionamento N:N (`TurmasProfessor`)
   - Função `atualizarVinculosTurmasProfessor()` compara estado atual vs desejado
   - Adiciona/remove vínculos automaticamente em uma transação
   - Retorna estatísticas da operação (adicionados, removidos, mantidos)

## Observações

- Sempre validar `idEscola` do cookie antes de operações multi-tenant
- Migrations seguem padrão `YYYYMMDDHHMMSS_descricao`
- `@db.LongText` usado para campos de texto longo (ex: mensagens, relatórios)

## 📝 Manutenção das Instruções

**AO FINAL DE CADA SOLICITAÇÃO**, avalie se novos padrões, convenções ou aprendizados foram estabelecidos durante a implementação. Se sim:

1. **Atualize este arquivo** com os padrões aprendidos
2. **Documente exemplos práticos** de código quando relevante
3. **Adicione ao checklist** se for um processo repetível
4. **Mantenha a organização** e clareza das instruções

Isso garante que o conhecimento do projeto evolua de forma incremental e que futuras solicitações sigam os mesmos padrões de qualidade.
