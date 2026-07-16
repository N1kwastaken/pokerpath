# ♠ PokerPath

Aprenda poker como um jogo — trilha gamificada (estilo Duolingo) com aulas
ilustradas, mini-jogos, treino de decisões em mesas reais e charts GTO.

**🌐 Produção:** https://pokerpath.onrender.com
*(plano grátis do Render: após ~15 min sem uso, o primeiro acesso demora ~30–60s para "acordar")*

## O que tem no app

- **4 níveis em espiral** — Primeiros Passos (Mundo 0), Iniciante, Intermediário
  e Avançado; cada nível cobre do preflop ao river, com jargão crescendo aos poucos.
  ~110 fases e ~760 exercícios validados contra os ranges.
- **Modo visitante** — o Mundo 0 é jogável **sem conta** (`/g`); ao criar a
  conta, o progresso "gradua" automaticamente.
- **Prova de nivelamento** — quem já jogou pode pular níveis (`/placement`).
- **Aulas interativas** — mini-jogos (ordenar cartas, combinar pares), quizzes
  com a situação montada na mesa, tutorial guiado na primeira prática.
- **Treino na mesa** — Fold/Call/Raise (e Bet/Check como agressor) com
  frequências GTO no feedback, cheat-sheet de range (📊) e glossário integrado.
- **Charts GTO** — abertura (RFI) e 3-bet/defesa, com células mistas proporcionais.
- **Gamificação** — XP, níveis, streak, energia, conquistas, missões diárias e
  semanais, fichas douradas por fase perfeita.
- **Amigos** — código curto para adicionar; lista com XP, nível e streak.
- **Cores por progresso** — cada nível concluído libera uma cor de app;
  prata ao terminar o jogo, ouro no 100% perfeito.
- **Contas DEV** — toda conta criada antes do launch tem premium liberado +
  badge DEV (`User.isDev`, default `true`; trocar para `false` no launch).
- **Mascote Ace** — sprite sheet de expressões em `apps/web/public/mascot-sheet.png`.

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

| Camada      | Tecnologia                              |
| ----------- | --------------------------------------- |
| Frontend    | React 18, Vite 6, TypeScript, TailwindCSS |
| Backend     | Node.js, Fastify 5, TypeScript          |
| Banco       | SQLite (dev) · PostgreSQL/Neon (produção) |
| Auth        | JWT (access + refresh) + bcrypt         |
| Deploy      | Render (API serve o build do web) + Neon |

> **Banco:** o desenvolvimento usa **SQLite** (`apps/api/prisma/dev.db`).
> Como o SQLite não suporta `enum`, os campos de enum são `String`, validados
> pelos schemas Zod em `packages/shared` — a fonte única de verdade.
> Em produção o schema Postgres é **gerado no build** a partir do principal
> (`apps/api/prisma/make-postgres-schema.mjs`).

## Rodando localmente

Pré-requisito: Node.js >= 20.

```bash
npm install
cp apps/api/.env.example apps/api/.env   # já vem com SQLite por padrão
npm run build:shared                     # necessário antes do primeiro run
npm run db:generate
npm run db:migrate
npm run db:seed                          # mundos, fases, exercícios, charts, conquistas
npm run dev                              # API + Web em paralelo
```

- Web: http://localhost:5173 · API: http://localhost:3333/api · Health: `/api/health`
- Também há `.claude/launch.json` com os dois servidores (`api`, `web`).

| Comando               | Descrição                          |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Sobe API + Web juntos              |
| `npm run dev:api` / `dev:web` | Só um dos lados             |
| `npm run db:studio`   | Prisma Studio (UI do banco)        |
| `npm run db:seed`     | Re-seed (idempotente: preserva progresso) |
| `npm run typecheck`   | Checagem de tipos em todos os pkgs |

## Deploy (Render + Neon)

O deploy é automático: **todo push na `main` redeploya** o serviço do Render
(blueprint em `render.yaml`). O build instala tudo (`npm ci --include=dev`),
gera o client Prisma para Postgres, compila shared+api+web, aplica o schema no
Neon (`db push`) e roda o seed (idempotente). Em produção a própria API serve
o site (`@fastify/static` + fallback SPA) — um serviço só, sem CORS.

Variáveis no Render: `DATABASE_URL` (Neon, conexão direta), `NODE_ENV`,
`NODE_VERSION=22` e segredos JWT gerados pelo painel.

## E-mail

Driver plugável por env (`MAIL_DRIVER`), sem mudar código:

- **`console`** (padrão, dev): o e-mail é impresso no log da API — é assim que
  se copia o link de redefinir senha localmente. **Nada é enviado.**
- **`resend`**: envia de verdade (exige `RESEND_API_KEY` e `MAIL_FROM`).

Três e-mails: **boas-vindas** (no cadastro), **redefinir senha** (30 min, uso
único) e o **lembrete diário de streak**.

O lembrete é disparado por HTTP, para funcionar com qualquer agendador:

```bash
curl -X POST -H "x-cron-secret: $CRON_SECRET" \
  https://pokerpath.onrender.com/api/jobs/streak-reminder
# -> {"candidates":1,"sent":1,"skipped":11,"failed":0}
```

Só recebe quem **jogou ontem e ainda não hoje** (mesma regra do banner no app),
não optou por sair e ainda não foi lembrado hoje — a rota é idempotente. Sem
`CRON_SECRET` definido, ela fica desligada. Cada e-mail traz um link de
descadastro de um clique (token assinado, sem login), e a preferência também
fica no perfil.

> **Resend precisa de domínio verificado** para enviar a qualquer endereço. Sem
> domínio, a chave de teste só entrega no e-mail dono da conta Resend.

## API (visão geral)

Rotas autenticadas (`Authorization: Bearer <accessToken>`): `/worlds`, `/trail`,
`/stages/:id` (exercícios **sem gabarito** — validação server-side), `/answers`,
`/stages/:id/complete`, `/stats`, `/energy`, `/review`, `/placement`,
`/achievements`, `/missions`, `/friends`, `/guest/graduate`.

Rotas públicas: `/auth/*` (register/login/refresh/forgot/reset), `/ranges`
(charts), `/guest/world0` e `/guest/stages/:id` (modo visitante — só Mundo 0,
com gabarito no payload porque a validação é local e sem XP).

## Contas úteis (dev)

- Godmode (debug, tudo liberado): `sousa@gmail.com`
- Teste local: `reset.teste@pokerpath.dev` / `senhanova123`

## Próximos passos

Ranges postflop refinados por textura (solver), postflop no nível Avançado,
tradução EN (`pp.lang`), e-mail de recuperação em produção (Resend + domínio),
pagamento (Stripe) e app mobile.
