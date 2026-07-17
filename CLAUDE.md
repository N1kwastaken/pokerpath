# Guia para assistentes de IA (e para humanos novos no projeto)

Convenções e armadilhas do PokerPath que **não dá para deduzir lendo o código** —
cada uma aqui já causou um bug real. A visão geral do produto, os comandos e a
arquitetura estão no [README.md](README.md); este arquivo é só o que morde.

Formato propositalmente genérico (markdown puro): serve para qualquer
assistente, e vive no Git junto do código.

## Regras de trabalho

- **Desafiar ideia ruim em vez de concordar.** Se o pedido tem um problema,
  dizer antes de escrever código.
- Começar tarefas com um resumo curto + recomendação, não com um despejo de opções.
- **Não subir o site em preview para "conferir"** — valida com `npm run typecheck`
  e `curl`. Preview no chat gasta tokens à toa.

## As três regras que quebram o produto

### 1. Todo preflop é grátis. Sempre.

Premium é **por fase**, e a fase é marcada no seed (`apps/api/prisma/seed.ts`,
~L1645):

```ts
const premium = w.order >= 2 && s.exercises.some((e) => e.board);
```

Ou seja: **adicionar um exercício com `board` a uma fase de preflop do Mundo 2/3
paywalla aquele preflop** — silenciosamente, sem erro nenhum. É por isso que o
'Desafio final' do Avançado segue preflop-only. Para postflop novo, criar fase
própria. `scratchpad/premium.mjs` afirma essa invariante.

Para contas FREE, fases premium **não** travam a corrente de progressão nem
contam para completar o mundo (`isStagePremiumLocked` em `game.service.ts`).

### 2. RFI tem que bater com o chart

Todo exercício `category: 'OPEN_RAISE'` sem `villainAction` precisa bater com
`RANGE_DEFS` (UTG/MP/CO/BTN/SB) no seed. **Gerar `correctAction` a partir do
range — nunca escrever na mão.** A checagem tem que dar 0 divergências.

RFI é raise-ou-fold: **não existe call**. Call só aparece nos charts de defesa
(`scenario: VS_<pos>`).

> Os 10 charts de defesa **sem exercícios por trás** são ranges simplificadas
> feitas à mão, não saída de solver. Podem ter células discutíveis.

### 3. Enums são `String`

O SQLite não suporta `enum`, então todo campo de enum no Prisma é `String`. A
fonte única de verdade da validação é o Zod em `packages/shared/src/domain.ts`.
Produção é Postgres, com o schema **gerado no build** a partir do principal
(`prisma/make-postgres-schema.mjs`) — o schema de produção não se edita à mão.

## Armadilhas conhecidas

- **`prisma migrate dev` pode apagar dados.** Ao recriar uma tabela
  (`RedefineTables`), o `INSERT` gerado já veio **sem a coluna `friendCode`** e
  zerou todos os códigos. Se aparecer um RedefineTables, **conferir coluna por
  coluna** — ou trocar por `ADD COLUMN` simples. Produção usa `db push` no
  Postgres e não corre esse risco.
- **`migrate dev` trava sem TTY** quando há warning. Alternativa:
  `prisma migrate diff --from-migrations ... --script > migration.sql` +
  `migrate deploy`.
- **Depois de mexer no seed: `npm run db:seed` E reiniciar a API.**
- **Conceito novo de fase precisa de prefixo casado** em
  `apps/web/src/lib/stageGroup.ts`, senão cai calado em 'Fundamentos'. A **ordem
  dos regexes importa** (3-Bet/4-Bet/vs-posição/squeeze/textura vêm antes dos
  genéricos como `/teste/` e `/board/`).
- **`WEB_ORIGIN` monta o link dos e-mails.** Se cair no fallback de localhost em
  produção, todo link de reset aponta para a máquina de quem recebeu. Está
  explícito no `render.yaml` e a API avisa no boot.
- **Banco de produção (Neon) é separado do local** — contas de dev não existem lá.
- **`forgot-password` tem dois portões silenciosos** (`if (user)` e limite de
  3/hora) e a resposta é sempre idêntica, de propósito (anti-enumeração). De
  fora, "não chegou e-mail" é indistinguível de rate-limit — olhar o log.

## Validação antes de concluir

O seed é grande (~1.6k linhas) e Edit/Write às vezes truncam. **Preferir editar
por script** (node/python) e **validar sempre**.

Os scripts de validação transpilam o `seed.ts` com `ts.transpileModule` + `vm`,
stubando o `PrismaClient` e removendo o `main()`. O `typescript` está no
`node_modules` da **raiz** do monorepo, não em `apps/api`.

O que checar conforme o que você mexeu:

| Mexeu em          | Checar                                                       |
| ----------------- | ------------------------------------------------------------ |
| exercício preflop | RFI × `RANGE_DEFS` → 0 divergências                          |
| chart             | chart × exercício → 0 divergências; 0 overlaps raise/call     |
| exercício postflop| 0 cartas duplicadas (`heroHand` + `board`); 0 fold em spot de agressor |
| fase nova         | nenhum preflop atrás do paywall; aula tem lição e grupo roteado |

Convenções do domínio que não são óbvias:

- **Spot de agressor** = `villainAction: 'Check'` ⇒ botões **Bet/Check**
  (`RAISE`/`CALL`), **sem fold**.
- Um FOLD não pode formar sequência/flush/overpair sem querer — o exercício
  ficaria pedagogicamente errado mesmo estando "certo" no código.

## Detalhes que enganam

- **Dark é o padrão** (`:root`); light é `[data-theme='light']`. Tokens Tailwind
  mapeiam `rgb(var(--x))` em `apps/web/src/index.css`.
- **A cor de destaque varia** (`data-accent`). Texto de aula não escreve "verde":
  escreve o placeholder `{cor}`, resolvido por `withAccentWord()`
  (`lib/accent.ts`). O `Glossarized` já resolve para todo texto que passa por ele.
- **Níveis de XP são só títulos** — nada é gated por eles. As cores saem de
  **mundo concluído**; as conquistas, de **feitos**. A `/levels` declara a
  condição real de cada trilha em vez de fingir que o XP libera.
- **Fold é vermelho nos botões, mas neutro nos charts** (`rgb(var(--card2))`).
  Vermelho no chart foi testado e rejeitado: "desagradável aos olhos".
- **`isDev` tem `@default(true)`** (beta pré-launch ⇒ premium liberado).
  **Trocar para `false` no launch.**
- **Godmode** (`sousa@gmail.com`, `lib/godmode.ts`) ignora **toda** trava,
  inclusive a progressão — diferente de DEV, que só vira PREMIUM.
