import { Link } from 'react-router-dom';

/**
 * Privacidade e Termos.
 *
 * O texto descreve o que o app REALMENTE faz — os campos vieram do schema e
 * os terceiros, do código de e-mail e do render.yaml. Boilerplate genérico
 * seria pior que nada: prometeria o que o produto não cumpre.
 *
 * `CONTATO` e `RESPONSÁVEL` são os únicos pontos que dependem de decisão de
 * fora do código (quem responde juridicamente pelo app).
 */
const CONTATO = 'pokerpath.app@gmail.com';
const RESPONSAVEL = 'PokerPath (projeto em fase beta, operado por pessoa física)';
const ATUALIZADO = '22 de julho de 2026';

export function PrivacyPage() {
  return (
    <Doc title="Política de Privacidade" outro="termos">
      <P>
        Esta política explica quais dados o PokerPath coleta, por que coleta e o que você pode
        fazer a respeito. Ela vale para o aplicativo em <b>pokerpath.onrender.com</b>.
      </P>

      <H>Quem é responsável</H>
      <P>{RESPONSAVEL}. Contato para qualquer assunto de privacidade: <b>{CONTATO}</b>.</P>

      <H>O que coletamos</H>
      <P>Só o necessário para o app funcionar. Nada é comprado de terceiros.</P>
      <Ul items={[
        <>
          <b>Cadastro:</b> nome e e-mail. A senha é guardada apenas como <i>hash</i> —
          nem nós conseguimos lê-la.
        </>,
        <>
          <b>Uso do app:</b> respostas dos exercícios, fases concluídas, XP, sequência de dias,
          conquistas e missões. É isso que faz sua trilha e suas estatísticas existirem.
        </>,
        <>
          <b>Onboarding (opcional):</b> seu nível de experiência, com que frequência joga e seu
          objetivo — usados para ajustar o conteúdo.
        </>,
        <>
          <b>Foto de perfil (opcional):</b> se você escolher uma, ela é reduzida no seu
          aparelho para 96&times;96 pixels e guardada junto da sua conta.
        </>,
        <>
          <b>Código de amigo:</b> um código curto gerado para você ser adicionado por amigos.
        </>,
      ]} />

      <H>O que NÃO fazemos</H>
      <Ul items={[
        <>Não usamos Google Analytics, pixel do Facebook nem qualquer rastreador de terceiros.</>,
        <>Não vendemos, alugamos nem compartilhamos seus dados com anunciantes.</>,
        <>Não pedimos acesso a contatos, localização, câmera, microfone ou galeria — a foto de
          perfil usa o seletor de arquivos do próprio sistema, sob seu comando.</>,
      ]} />

      <H>Quem mais vê seus dados</H>
      <P>Apenas os serviços necessários para o app existir:</P>
      <Ul items={[
        <><b>Render</b> — hospedagem do site e da API.</>,
        <><b>Neon</b> — banco de dados onde ficam a conta e o progresso.</>,
        <><b>Resend</b> — envio dos e-mails de recuperação de senha e do lembrete de sequência.
          Recebe seu e-mail e o conteúdo da mensagem.</>,
      ]} />
      <P>
        Seus <b>amigos</b> (quem você adicionar pelo código) veem seu nome, foto, nível, XP,
        sequência e os badges que você escolher exibir. Nada além disso.
      </P>

      <H>Por quanto tempo guardamos</H>
      <P>
        Enquanto sua conta existir. Você pode apagar tudo a qualquer momento em
        <b> Configurações → Reiniciar progresso</b> (apaga XP, fases, conquistas e sequência,
        mantendo o login) ou pedir a <b>exclusão total da conta</b> escrevendo para {CONTATO} —
        respondemos em até 15 dias.
      </P>

      <H>Seus direitos (LGPD)</H>
      <P>
        A Lei Geral de Proteção de Dados (Lei 13.709/2018) garante que você peça a qualquer
        momento: confirmação de que tratamos seus dados, acesso a eles, correção do que estiver
        errado, portabilidade, e a exclusão. Basta escrever para <b>{CONTATO}</b>.
      </P>

      <H>Cookies</H>
      <P>
        Não usamos cookies de rastreamento. O app guarda no seu navegador apenas o necessário
        para funcionar: seu login, o tema, a cor escolhida, as preferências de acessibilidade e o
        progresso do modo visitante.
      </P>

      <H>Menores de idade</H>
      <P>
        O PokerPath ensina estratégia de pôquer e é destinado a maiores de 18 anos. Não coletamos
        dados de menores conscientemente.
      </P>

      <H>Mudanças</H>
      <P>
        Se esta política mudar de forma relevante, avisamos no app. Última atualização: {ATUALIZADO}.
      </P>
    </Doc>
  );
}

export function TermsPage() {
  return (
    <Doc title="Termos de Uso" outro="privacidade">
      <P>
        Ao criar uma conta no PokerPath você concorda com estes termos. Eles são curtos de
        propósito.
      </P>

      <H>O que o PokerPath é</H>
      <P>
        Um aplicativo <b>educativo</b> que ensina estratégia de pôquer (Texas Hold'em) por meio
        de exercícios e aulas. É material de estudo.
      </P>

      <H>O que o PokerPath NÃO é</H>
      <Ul items={[
        <><b>Não é um jogo a dinheiro.</b> Não há apostas, depósitos, saques nem fichas com valor
          real. Nada aqui é jogo de azar.</>,
        <><b>Não é promessa de lucro.</b> Estudar estratégia melhora suas decisões; não garante
          ganho nenhum. Pôquer envolve risco financeiro real quando jogado a dinheiro, em
          plataformas que não são nossas.</>,
        <><b>Não é aconselhamento financeiro.</b></>,
      ]} />

      <H>Sua conta</H>
      <Ul items={[
        <>Você precisa ter <b>18 anos ou mais</b>.</>,
        <>Os dados do cadastro devem ser verdadeiros, e a senha é responsabilidade sua.</>,
        <>Uma conta por pessoa. Não compartilhe o acesso.</>,
      ]} />

      <H>Uso aceitável</H>
      <P>Não é permitido:</P>
      <Ul items={[
        <>tentar burlar limites, autenticação ou o funcionamento do app;</>,
        <>usar robôs ou automação para acumular XP, sequência ou conquistas;</>,
        <>publicar como foto de perfil ou nome conteúdo ofensivo, ilegal ou de terceiros sem
          autorização;</>,
        <>copiar o conteúdo das aulas e exercícios para redistribuir.</>,
      ]} />
      <P>
        Podemos suspender contas que descumprirem isso. Se achar que foi engano, escreva para
        {' '}{CONTATO}.
      </P>

      <H>Fase beta</H>
      <P>
        O PokerPath está em <b>beta</b>: funcionalidades mudam, podem existir falhas e o serviço
        pode ficar fora do ar. Contas criadas nesta fase recebem os recursos Premium liberados
        como agradecimento — isso é uma cortesia, não um contrato vitalício, e comunicaremos
        qualquer mudança antes que ela valha.
      </P>

      <H>Pagamentos</H>
      <P>
        Ainda não há cobrança. Quando houver, os valores, o período de teste e as regras de
        cancelamento serão informados na tela de assinatura antes de qualquer pagamento, e estes
        termos serão atualizados.
      </P>

      <H>Conteúdo</H>
      <P>
        As aulas, exercícios, textos e artes do PokerPath são nossos. A sua foto de perfil e seu
        nome continuam seus — você só nos autoriza a exibi-los no app para você e seus amigos.
      </P>

      <H>Limitação</H>
      <P>
        O app é oferecido "como está". Não nos responsabilizamos por perdas decorrentes do uso do
        conteúdo — inclusive por resultados em jogos de pôquer a dinheiro, que acontecem fora
        daqui e por sua conta e risco.
      </P>

      <H>Encerramento</H>
      <P>
        Você pode parar de usar quando quiser e pedir a exclusão da conta por {CONTATO}.
      </P>

      <H>Lei aplicável</H>
      <P>
        Estes termos seguem as leis do Brasil. Última atualização: {ATUALIZADO}.
      </P>
    </Doc>
  );
}

// ─── casca comum ──────────────────────────────────────────────
function Doc({ title, outro, children }: {
  title: string; outro: 'privacidade' | 'termos'; children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-5 py-8">
      <Link to="/settings" className="mb-4 inline-block text-sm font-medium text-subtle">← Configurações</Link>
      <h1 className="text-3xl font-bold text-title">{title}</h1>
      <div className="mt-5 space-y-4">{children}</div>
      <Link
        to={outro === 'termos' ? '/termos' : '/privacidade'}
        className="mt-8 flex w-full items-center justify-center rounded-2xl border border-line bg-card p-4 font-medium text-title active:scale-[0.98]"
      >
        Ler {outro === 'termos' ? 'os Termos de Uso' : 'a Política de Privacidade'}
      </Link>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 text-base font-bold text-title">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-text">{children}</p>;
}
function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-text">
          <span aria-hidden className="mt-[0.15rem] shrink-0 text-primary">•</span>
          <span className="min-w-0">{it}</span>
        </li>
      ))}
    </ul>
  );
}
