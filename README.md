# ♠ PokerPath

Aplicativo gamificado para aprender poker — estilo Duolingo.
Implementação baseada no PRD oficial do projeto.

## Arquitetura

Monorepo com npm workspaces:

```
pokerpath/
├── apps/
│   ├── web/        # Frontend — React + Vite + TypeScript + Tailwind
│   └── api/        # Backend  — Fastify + Prisma + JWT
└── packages/
    └── shared/     # Tipos, enums e schemas Zod compartilhados
```

### Stack

| Camada      | Tecnologia                              |
| ----------- | --------------------------------------- |
| Frontend    | React 18, Vite, TypeScript, TailwindCSS |
| Backend     | Node.js, Fastify 5, TypeScript          |
| Banco       | SQLite (dev) · PostgreSQL (produção)    |
| Auth        | JWT (access + refresh) + bcrypt         |
| Compartilh. | Zod schemas + tipos de domínio          |

> **Banco:** o desenvolvimento usa **SQLite** (`apps/api/prisma/dev.db`) para
> rodar sem subir um servidor. Em produção, troque `provider` para `postgresql`
> em `apps/api/prisma/schema.prisma` (PRD 15.2). Como o SQLite não suporta
> `enum`, os campos de enum são `String`, validados pelos schemas Zod em
> `packages/shared` — a fonte única de verdade.

## Pré-requisitos

- Node.js >= 20

## Configuração inicial

```bash
# 1. Instalar dependências (raiz do monorepo)
npm install

# 2. Configurar variáveis de ambiente da API
cp apps/api/.env.example apps/api/.env   # já vem com SQLite por padrão

# 3. Build do pacote compartilhado (necessário antes do primeiro run)
npm run build:shared

# 4. Banco de dados
npm run db:generate    # gera o Prisma Client
npm run db:migrate     # cria as tabelas (SQLite)
npm run db:seed        # popula Mundos 1–5, fases, exercícios, conquistas e missões

# 5. Rodar tudo (API + Web em paralelo)
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3333/api
- Healthcheck: http://localhost:3333/api/health

## Scripts úteis

| Comando               | Descrição                          |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Sobe API + Web juntos              |
| `npm run dev:api`     | Só a API                           |
| `npm run dev:web`     | Só o frontend                      |
| `npm run db:studio`   | Prisma Studio (UI do banco)        |
| `npm run typecheck`   | Checagem de tipos em todos os pkgs |

## API do loop de jogo

Todas exigem `Authorization: Bearer <accessToken>`.

| Método | Rota              | Função                                                |
| ------ | ----------------- | ----------------------------------------------------- |
| POST   | `/onboarding`     | Salva as 3 respostas e conclui o onboarding (PRD 4.1) |
| GET    | `/worlds`         | Mapa de mundos com progresso e bloqueios              |
| GET    | `/worlds/:id`     | Fases do mundo com status de desbloqueio              |
| GET    | `/stages/:id`     | Exercícios da fase **sem o gabarito** (PRD 15.5)      |
| POST   | `/answers`        | Valida a resposta no servidor; devolve XP e feedback  |

A resposta correta nunca é enviada junto do exercício: a validação é
server-side (PRD 15.5). O `POST /answers` calcula XP, progressão de fase/mundo,
streak e conquistas, retornando tudo o que o cliente precisa para o feedback.

## Status

✅ **Etapa 1 — Base do projeto**
Estrutura, ambiente, frontend, backend, banco e autenticação.

✅ **Etapa 2 — Loop completo de jogo**
Onboarding, Dashboard, Mapa de Mundos, Detalhe do Mundo, tela de Exercício com
cartas e feedback imediato, Resumo da fase. Backend: conteúdo (mundos/fases/
exercícios), `POST /answers` com XP, progressão linear, streak, conquistas,
gating premium (Mundos 4+) e limite diário do plano FREE.

🔜 Próximas etapas (PRD): Conquistas (tela), Missões, Ligas/Ranking,
mais Mundos (8–15: Facing Raise, 3Bet, 4Bet, C-Bet, Turn, River, ICM, Exploit),
integração de pagamento (Stripe) e app mobile (React Native).
