# -*- coding: utf-8 -*-
"""
Reescreve as explicações do seed no formato estruturado (título + tópicos).

Por que existe: as explicações antigas eram telegráficas ("Overpair: raise.").
O formato novo cabe numa string só — 1ª linha = título, linhas com "• " =
tópicos — porque `explanation` é String no Prisma e não valia um schema novo.
Quem renderiza é apps/web/src/components/Explanation.tsx.

Roda linha a linha sobre seed.ts: cada exercício literal cabe numa linha e
carrega heroHand/board/category/correctAction/villainAction, então não existe
suposição de ordem entre o arquivo e o array em memória.

Uso:  python scratchpad/rewrite-explanations.py [--apply]
      (sem --apply só imprime uma amostra)
"""
import io
import re
import sys

SEED = 'apps/api/prisma/seed.ts'
RANKS = '23456789TJQKA'
PAIR_NAME = {'A': 'ases', 'K': 'reis', 'Q': 'damas', 'J': 'valetes', 'T': 'dez',
             '9': 'noves', '8': 'oitos', '7': 'setes', '6': 'seis', '5': 'cincos',
             '4': 'quatros', '3': 'três', '2': 'duques'}
CARD_NAME = {'A': 'ás', 'K': 'rei', 'Q': 'dama', 'J': 'valete', 'T': 'dez'}


def pick(options, seed_text):
    """Escolhe uma variante de forma estável (mesma mão => mesma frase).

    Sem isto a mesma frase de fecho apareceria em ~100 exercícios seguidos, e
    o texto repetido é o que faz a pessoa parar de ler a explicação.
    """
    h = 0
    for ch in seed_text:
        h = (h * 31 + ord(ch)) % 100003
    return options[h % len(options)]


# ─── leitura dos campos da linha ────────────────────────────────
def field(line, key):
    m = re.search(r"\b%s: '([^']*)'" % key, line)
    return m.group(1) if m else None


def cards(s):
    return re.findall(r'([2-9TJQKA])([♠♥♦♣])', s or '')


def code(hand):
    """A♠A♥ -> AA ; A♠K♠ -> AKs ; K♠J♦ -> KJo"""
    c = cards(hand)
    if len(c) != 2:
        return None
    (r1, s1), (r2, s2) = c
    if RANKS.index(r1) < RANKS.index(r2):
        (r1, s1), (r2, s2) = (r2, s2), (r1, s1)
    if r1 == r2:
        return r1 + r2
    return r1 + r2 + ('s' if s1 == s2 else 'o')


def shape(cd):
    hi, lo = cd[0], cd[1]
    return {
        'pair': hi == lo, 'suited': cd.endswith('s'), 'hi': hi, 'lo': lo,
        'hiv': RANKS.index(hi), 'lov': RANKS.index(lo),
        'gap': RANKS.index(hi) - RANKS.index(lo), 'ace': hi == 'A',
        'broadway': RANKS.index(lo) >= RANKS.index('T'),
    }


def texture(board):
    c = cards(board)
    if not c:
        return None
    rs = [r for r, _ in c]
    ss = [s for _, s in c]
    idx = sorted(RANKS.index(r) for r in rs)
    suit_max = max(ss.count(s) for s in set(ss))
    gaps = [idx[i + 1] - idx[i] for i in range(len(idx) - 1)]
    return {
        'paired': len(set(rs)) < len(rs),
        'twotone': suit_max >= 2, 'mono': suit_max >= 3,
        'connected': any(g <= 2 for g in gaps),
        'high': idx[-1] >= RANKS.index('T'),
        'wet': suit_max >= 2 and any(g <= 2 for g in gaps),
        'ranks': '-'.join(rs), 'top': RANKS[idx[-1]],
    }


# ─── conceito: lido do texto ANTIGO ─────────────────────────────
# Reaproveitar o rótulo antigo é mais seguro que reavaliar a mão do zero: ele
# já foi revisado à mão e os testes de conteúdo passam em cima dele.
def norm(t):
    for a, b in [('á', 'a'), ('â', 'a'), ('ã', 'a'), ('é', 'e'), ('ê', 'e'),
                 ('í', 'i'), ('ó', 'o'), ('ô', 'o'), ('õ', 'o'), ('ú', 'u'),
                 ('ç', 'c')]:
        t = t.replace(a, b)
    return t.lower()


def concept(old):
    t = norm(old)
    if 'full house' in t or 'full of' in t or 'sevens full' in t:
        return 'FULL'
    if 'trinca' in t:
        return 'SET'
    if ('sequencia feita' in t or 'sequencia maxima' in t or 'fez a sequencia' in t
            or re.search(r'sequencia[ ]*(j-alto|:|\()', t)):
        return 'STRAIGHT'
    if 'dois pares' in t:
        return 'TWO_PAIR'
    if ('monster draw' in t or 'flush+seq' in t or 'flush + sequencia' in t
            or ('flush' in t and 'sequencia' in t)):
        return 'COMBO'
    if 'overpair' in t:
        return 'OVERPAIR'
    if 'top pair' in t or 'top kicker' in t:
        return 'TOP_PAIR'
    if ('nao veio' in t or 'nao fechou' in t or 'falhou' in t or 'que errou' in t
            or 'projeto morto' in t):
        return 'BUSTED'
    if 'nut flush draw' in t or 'flush maximo' in t:
        return 'NFD'
    if 'flush draw' in t or 'projeto de flush' in t:
        return 'FD'
    if 'sequencia aberta' in t or 'open-ended' in t:
        return 'OESD'
    if 'gutshot' in t:
        return 'GUTSHOT'
    if ('par medio' in t or 'par do meio' in t or 'par de baixo' in t
            or 'bottom pair' in t or 'par pequeno' in t or 'underpair' in t
            or 'par abaixo' in t or re.search(r'par de \w+ sob', t)):
        return 'WEAK_PAIR'
    # "JJ debaixo de A e K", "TT sob K e Q", "99 sob A e K"
    if re.search(r'\b(aa|kk|qq|jj|tt|99|88|77|66|55|44|33|22)\b', t) and (
            ' sob ' in t or 'debaixo' in t):
        return 'WEAK_PAIR'
    return 'AIR'


DRAW = {'NFD': ('o *flush draw* máximo', 9), 'FD': ('*flush draw*', 9),
        'OESD': ('uma sequência *open-ended*', 8), 'GUTSHOT': ('um *gutshot*', 4),
        'COMBO': ('*flush draw* + sequência', 15)}
STREET = {'C_BET': 'flop', 'TURN': 'turn', 'RIVER': 'river'}
# Nomear a mão importa: "sua mão é forte" ensina menos que "trinca de damas".
MADE = {'FULL': 'um *full house*', 'SET': 'uma *trinca*',
        'STRAIGHT': 'uma sequência feita', 'TWO_PAIR': 'dois pares',
        'OVERPAIR': 'um *overpair* — par maior que qualquer carta do board',
        'TOP_PAIR': 'o *top pair*', 'WEAK_PAIR': 'um par fraco'}


def made_name(con, old, hand_code):
    n = MADE.get(con, 'uma mão forte')
    if con == 'SET':
        return 'uma *trinca* de %s' % PAIR_NAME.get(hand_code[0], hand_code[0])
    if con == 'TOP_PAIR' and 'top kicker' in norm(old):
        return 'o *top pair* com o melhor *kicker*'
    return n


# ─── títulos ────────────────────────────────────────────────────
def headline(ex):
    act, cat = ex['correctAction'], ex['category']
    if ex['aggressor']:                      # botões Bet/Check, sem fold
        return 'Aposte porque:' if act == 'RAISE' else 'Check porque:'
    if ex['board']:
        return {'RAISE': 'Aumente porque:', 'CALL': 'Pague porque:',
                'FOLD': 'Desista porque:'}[act]
    if cat == 'OPEN_RAISE':
        return 'Abra com raise porque:' if act == 'RAISE' else 'Não abra porque:'
    if cat == 'FOUR_BET':
        return {'RAISE': '4-bet porque:', 'CALL': 'Pague o 3-bet porque:',
                'FOLD': 'Desista porque:'}[act]
    squeeze = bool(ex.get('callerPosition'))
    if act == 'RAISE':
        return 'Faça o squeeze porque:' if squeeze else '3-bet porque:'
    return {'CALL': 'Pague porque:', 'FOLD': 'Desista porque:'}[act]


# ─── tópicos: preflop de abertura (RFI) ─────────────────────────
def rfi_bullets(ex, sh, cd):
    pos = ex['heroPosition']
    out = []
    if ex['correctAction'] == 'RAISE':
        out.append('%s está dentro da *range* de abertura de %s.' % (cd, pos))
        out.append(RFI_POS.get(pos, ''))
        if sh['pair'] and sh['hiv'] >= RANKS.index('T'):
            out.append('Um par de %s já começa na frente de quase tudo que paga.'
                       % PAIR_NAME[sh['hi']])
        elif sh['pair']:
            out.append('Par pequeno abre para acertar *trinca* — e para levar o pote na hora quando ninguém conecta.')
        elif sh['suited'] and sh['gap'] <= 1 and not sh['broadway']:
            out.append('*Conectores* do mesmo naipe fazem sequência e flush escondidos: quando acertam, acertam grande.')
        elif sh['ace'] and sh['suited']:
            out.append('Ás *suited* faz o flush máximo e ainda é *blocker* de AA e AK.')
        elif sh['broadway']:
            out.append('Duas cartas altas fazem *top pair* com *kicker* bom.')
        elif sh['suited']:
            out.append('O naipe igual soma o flush — é o que faz essa mão passar do corte.')
        else:
            out.append('Carta alta com kicker razoável ganha muito pote sem acertar nada.')
    else:
        out.append('%s fica de fora da *range* de abertura de %s.' % (cd, pos))
        out.append(RFI_POS.get(pos, ''))
        if not sh['suited'] and sh['hiv'] >= RANKS.index('K') and sh['lov'] < RANKS.index('T'):
            out.append('Quando alguém paga, você costuma estar *dominado*: mesma carta alta, kicker melhor.')
        elif sh['pair']:
            out.append('Par pequeno só vale de verdade quando vira trinca (1 flop em 8) — e daqui você não tem preço nem posição para caçá-la.')
        elif sh['broadway'] and not sh['suited']:
            out.append('Duas figuras parecem fortes, mas *offsuit* elas fazem par e ficam atrás com frequência.')
        elif sh['suited'] and sh['gap'] >= 4:
            out.append('Mesmo do mesmo naipe, as cartas estão longe demais: o flush sozinho não sustenta a mão.')
        elif sh['gap'] >= 4:
            out.append('As cartas estão longe demais uma da outra: não fazem sequência nem par junto.')
        elif sh['suited']:
            out.append('O naipe ajuda, mas não o bastante: cartas baixas fazem flush pequeno e par fraco.')
        else:
            out.append('*Offsuit* e sem carta alta de verdade: ela faz par fraco e fica presa no pote.')
    return [b for b in out if b]


RFI_POS = {
    'UTG': 'De *UTG* ainda faltam 5 jogadores para falar depois de você.',
    'MP': 'De *MP* ainda faltam 4 jogadores para falar depois de você.',
    'CO': 'No *CO* só o botão e as blinds falam depois de você.',
    'BTN': 'No *botão* você joga o pote inteiro *em posição*.',
    'SB': 'Do *SB* você joga o pote inteiro *fora de posição* contra o BB.',
}


# ─── tópicos: preflop enfrentando aumento ───────────────────────
def vs_bullets(ex, sh, cd, old):
    act = ex['correctAction']
    vil = ex.get('villainPosition') or 'quem abriu'
    t = norm(old)
    out = []
    if act == 'RAISE':
        blefe = 'blocker' in t or 'blefe' in t
        if blefe:
            out.append('%s é *blefe*, não valor: o ás na sua mão é *blocker* — derruba metade das combinações de AA e AK dele.' % cd)
            out.append('Do mesmo naipe, ela ainda faz o flush máximo quando é paga.')
            out.append('Sem blefes, sua range de raise vira só AA/KK e todo mundo desiste.')
        else:
            out.append('%s é forte o bastante para *aumentar por valor* contra a range de %s.' % (cd, vil))
            if ex.get('callerPosition'):
                out.append('Já tem dois jogadores no pote: aumentar cobra dos dois e evita jogar *multiway*.')
            else:
                out.append('Só pagar deixaria o pote pequeno com a sua melhor mão.')
            out.append('Aumentar também toma a iniciativa: você aposta o flop, ele responde.')
    elif act == 'CALL':
        setmine = 'trinca' in t or 'set' in t
        out.append('%s é forte demais para desistir e fraca demais para aumentar.' % cd)
        if setmine:
            out.append('Pagar é para acertar *trinca*: acontece 1 vez em 8, mas quando vem costuma levar o stack dele.')
        elif sh['suited']:
            out.append('Do mesmo naipe ela joga bem depois do flop: faz flush e sequência, que ganham pote grande.')
        else:
            out.append('Pagar mantém no jogo as mãos dele que você domina.')
        out.append('Aumentar aqui só faria as piores desistirem e as melhores continuarem.')
    elif ex.get('callerPosition'):
        out.append('%s não aguenta um pote contra DOIS jogadores (%s abriu, %s pagou).'
                   % (cd, vil, ex['callerPosition']))
        out.append('Sem posição, você joga todas as ruas primeiro e no escuro.')
        out.append('Mão marginal em pote *multiway* é a receita de perder stack sem perceber.')
    else:
        out.append('%s não tem força para pagar o aumento de %s.' % (cd, vil))
        if not sh['suited'] and sh['hiv'] >= RANKS.index('T'):
            out.append('Contra quem abriu, essa mão vive *dominada*: mesma carta alta, kicker pior.')
        elif sh['pair']:
            out.append('Par pequeno precisa de trinca, e o preço aqui não paga essa caçada.')
        else:
            out.append('Sem par e sem projeto, você joga o flop torcendo — e torcer custa caro.')
        out.append(pick([
            'Desistir agora preserva fichas para os spots em que você tem vantagem.',
            'Pagar por curiosidade é o vazamento mais caro do jogador iniciante.',
            'Contra quem abriu de %s, o fold é a jogada que mais dá lucro a longo prazo.' % vil,
        ], ex['heroHand'] + str(vil)))
    return out


# ─── tópicos: pós-flop ──────────────────────────────────────────
def post_bullets(ex, sh, cd, con, old):
    act, tx = ex['correctAction'], texture(ex['board'])
    nome = made_name(con, old, cd)
    rua = STREET.get(ex['category'], 'flop')
    river = ex['category'] == 'RIVER'
    b = tx['ranks']
    out = []

    if ex['aggressor']:                       # você decide apostar ou dar check
        if act == 'RAISE':
            if con in MADE:
                out.append('Você tem %s: está na frente da maior parte do que ele defende no %s.' % (nome, b))
                out.append('Apostar é *value bet*: pares menores e projetos pagam.')
                if tx['wet']:
                    out.append('Board molhado: dar check deixaria o projeto ver a próxima carta de graça.')
                else:
                    out.append('O pote precisa crescer agora para a aposta do river valer alguma coisa.')
            elif con in DRAW:
                nome, outs = DRAW[con]
                out.append('Você tem %s: são %d cartas que te dão a melhor mão.' % (nome, outs))
                out.append('É *semi-blefe*: ganha na hora se ele desistir e ainda pode acertar depois.')
            else:
                out.append('O board %s combina com a *sua* range, não com a dele.' % b)
                out.append('Quem defende do %s quase nunca tem %s aqui.'
                           % (ex.get('villainPosition') or 'BB',
                              CARD_NAME.get(tx['top'], tx['top'])))
                out.append('Mesmo sem par, a aposta leva o pote na hora — é *blefe* barato.')
        else:                                  # CHECK
            if con == 'WEAK_PAIR':
                out.append('Seu par já tem *showdown*: ele ganha de todos os blefes dele.')
                out.append('Apostar só faria as mãos melhores pagarem e as piores desistirem.')
                out.append('*Check* controla o pote e ainda leva muitos potes no river.')
            else:
                out.append('O board %s acerta a range dele em cheio, não a sua.' % b)
                out.append('Blefar num board que é do defensor é queimar fichas: ele quase nunca desiste.')
                out.append('*Check* e desista barato — dá para blefar em board melhor.')
    else:                                      # enfrentando aposta
        if act == 'RAISE':
            out.append('Você tem %s: forte demais para só pagar no %s %s.' % (nome, rua, b))
            if river:
                # No river não existe mais projeto nem proteção: o único
                # motivo de aumentar é extrair mais fichas.
                out.append('No river a única pergunta é quanto extrair — e pagar deixa dinheiro na mesa.')
                out.append('Ele paga o aumento com par bom achando que está na frente.')
            else:
                out.append('Aumentar cobra dos pares menores e dos projetos que ainda pagam.')
                if tx['wet']:
                    out.append('Board perigoso: você quer o dinheiro dentro agora, não na carta que te ultrapassa.')
        elif act == 'CALL':
            if con in DRAW:
                nome, outs = DRAW[con]
                out.append('Você tem %s: %d cartas te dão a melhor mão.' % (nome, outs))
                out.append('O preço do pote paga essa tentativa — aumentar seria caro demais.')
            elif con in ('TOP_PAIR', 'OVERPAIR', 'WEAK_PAIR'):
                out.append('Você tem %s no %s %s — ganha de todos os blefes dele.' % (nome, rua, b))
                out.append('É um *bluff-catcher*: pagar mantém os blefes na mão dele.')
                out.append('Aumentar espantaria justamente as mãos que você já ganha.')
            else:
                out.append('Sua mão ainda ganha de boa parte do que ele aposta aqui.')
                out.append('Pagar controla o pote sem transformar sua mão em blefe.')
        else:                                  # FOLD
            if con == 'BUSTED':
                out.append('Seu projeto não veio: %s não ganha de nada no *showdown*.' % cd)
                out.append('Sem par, pagar é só pagar a aposta dele.')
            elif con == 'WEAK_PAIR':
                out.append('Seu par está abaixo do board %s.' % b)
                out.append('Quase toda mão que aposta aqui já te passou.')
            elif river:
                out.append('No river não vem mais carta: %s não ganha de nada no *showdown*.' % cd)
                out.append('Pagar aqui é escolher perder a aposta — ele não blefa o bastante para compensar.')
            else:
                out.append('Você não tem par nem projeto real no %s %s.' % (rua, b))
                out.append('Sem cartas para melhorar, pagar é torcer — e torcer custa caro.')
            out.append(pick([
                'Desistir cedo é o que faz sobrar ficha para os potes que você ganha.',
                'O fold aqui não perde nada: perde quem paga para descobrir.',
                'Guardar essa aposta vale mais que a chance pequena de estar certo.',
            ], ex['heroHand'] + b))
    return out


# ─── montagem ───────────────────────────────────────────────────
def build(ex, old):
    cd = code(ex['heroHand'])
    if not cd:
        return None
    sh = shape(cd)
    if ex['board']:
        bullets = post_bullets(ex, sh, cd, concept(old), old)
    elif ex['category'] == 'OPEN_RAISE' and not ex.get('villainAction'):
        bullets = rfi_bullets(ex, sh, cd)
    else:
        bullets = vs_bullets(ex, sh, cd, old)
    return headline(ex) + '\n' + '\n'.join('• ' + b for b in bullets)


def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')


def main():
    apply = '--apply' in sys.argv
    src = io.open(SEED, encoding='utf-8').read().split('\n')
    changed, samples = 0, []
    for i, line in enumerate(src):
        if "explanation: '" not in line or 'heroHand:' not in line:
            continue
        ex = {k: field(line, k) for k in
              ('heroPosition', 'villainPosition', 'callerPosition', 'heroHand',
               'board', 'villainAction', 'correctAction', 'category')}
        ex['aggressor'] = ex['villainAction'] == 'Check'
        old = field(line, 'explanation')
        new = build(ex, old)
        if not new:
            continue
        # repl como lambda de propósito: com string, o re trata "\n" do texto
        # escapado como quebra de linha DE VERDADE e o seed vira erro de sintaxe.
        rep = "explanation: '%s'" % esc(new)
        src[i] = re.sub(r"explanation: '[^']*'", lambda _m: rep, line)
        changed += 1
        if True:
            samples.append((ex, old, new))
    if apply:
        io.open(SEED, 'w', encoding='utf-8', newline='\n').write('\n'.join(src))
        print('reescritas:', changed)
    else:
        import random
        filt = [a for a in sys.argv[1:] if not a.startswith('--')]
        if filt:
            samples = [s for s in samples if filt[0] in (s[0]['category'] or '')]
        random.seed(7)
        samples = random.sample(samples, min(12, len(samples)))
        for ex, old, new in samples:
            print('--- %s %s %s%s' % (ex['category'], ex['heroHand'],
                                      ex['heroPosition'],
                                      (' | ' + ex['board']) if ex['board'] else ''))
            print('ANTES:', old)
            print(new)
            print()
        print('linhas que seriam reescritas:', changed)


main()
