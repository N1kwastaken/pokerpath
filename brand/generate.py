"""Gera as artes do Instagram (@pokerpathbrasil) a partir da identidade do app.

Cores e fontes saem do próprio produto (index.css / tailwind.config.js), então a
página fica visualmente colada no app. Roda com:  python brand/generate.py
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "brand", "instagram")
FONTS = os.environ.get("PP_FONTS", os.path.join(ROOT, "brand", "fonts"))

# ── Identidade (mesma do app) ───────────────────────────────────────────
BG = (10, 13, 11)          # --bg
CARD_BG = (20, 25, 22)     # --card
GREEN = (31, 164, 99)      # --primary
BRAND = (27, 138, 76)      # verde da marca
FELT = (20, 81, 58)        # --felt-1
TITLE = (245, 247, 246)    # --title
SUBTLE = (132, 140, 135)   # --subtle
GOLD = (201, 168, 76)
PURPLE = (124, 92, 255)    # raise
RED = (217, 54, 62)        # fold
INK = (22, 24, 29)
CARD_RED = (217, 54, 62)

STORY = (1080, 1920)


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def sg(size, w=700):
    return font("SpaceGrotesk.ttf", size, w)


def inter(size, w=400):
    return font("Inter.ttf", size, w)


# Inter só tem ♥ e o Space Grotesk não tem naipe nenhum (o resto vira .notdef).
# Os naipes saem de uma fonte de símbolos do sistema.
SUIT_CANDIDATES = [r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\seguisym.ttf",
                   r"C:\Windows\Fonts\segoeui.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]


def suit_font(size):
    for p in SUIT_CANDIDATES:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    raise RuntimeError("nenhuma fonte com naipes encontrada")


def center(d, y, text, f, fill, w=STORY[0]):
    bb = d.textbbox((0, 0), text, font=f)
    d.text(((w - (bb[2] - bb[0])) / 2 - bb[0], y), text, font=f, fill=fill)
    return bb[3] - bb[1]


def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for word in words:
        t = (cur + " " + word).strip()
        if d.textlength(t, font=f) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def felt_glow(img):
    """Brilho verde suave ao fundo — lembra o feltro da mesa sem poluir."""
    glow = Image.new("RGB", (STORY[0] // 4, STORY[1] // 4), BG)
    g = ImageDraw.Draw(glow)
    g.ellipse([-40, 150, STORY[0] // 4 + 40, 330], fill=FELT)
    from PIL import ImageFilter
    glow = glow.filter(ImageFilter.GaussianBlur(38)).resize(STORY, Image.LANCZOS)
    return Image.blend(img, glow, 0.55)


def draw_card(img, x, y, rank, suit, w=290, h=406, tilt=0):
    """Carta branca no estilo do app: valor grande + naipe embaixo."""
    c = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    d.rounded_rectangle([20, 20, 20 + w, 20 + h], radius=30, fill=(255, 255, 255))
    col = CARD_RED if suit in "♥♦" else INK
    fr = sg(int(h * 0.42), 700)
    fs = suit_font(int(h * 0.26))
    br = d.textbbox((0, 0), rank, font=fr)
    bs = d.textbbox((0, 0), suit, font=fs)
    total = (br[3] - br[1]) + (bs[3] - bs[1]) + 18
    ty = 20 + (h - total) / 2
    d.text((20 + (w - (br[2] - br[0])) / 2 - br[0], ty - br[1]), rank, font=fr, fill=col)
    d.text((20 + (w - (bs[2] - bs[0])) / 2 - bs[0],
            ty + (br[3] - br[1]) + 18 - bs[1]), suit, font=fs, fill=col)
    if tilt:
        c = c.rotate(tilt, resample=Image.BICUBIC, expand=True)
    img.paste(c, (int(x), int(y)), c)


def hand_cards(img, hand, cy, scale=1.0):
    cards = [(hand[i], hand[i + 1]) for i in range(0, len(hand), 2)]
    w, h = int(290 * scale), int(406 * scale)
    gap = int(34 * scale)
    total = len(cards) * w + (len(cards) - 1) * gap
    x = (STORY[0] - total) / 2
    for i, (r, s) in enumerate(cards):
        draw_card(img, x + i * (w + gap) - 20, cy - h / 2 - 20,
                  "10" if r == "T" else r, s, w, h, tilt=(-5 if i == 0 else 5))


def brandbar(d, y=96):
    center(d, y, "POKERPATH", sg(40, 700), GREEN)


POS_NAME = {"UTG": "primeiro a falar", "MP": "no meio", "CO": "antes do botão",
            "BTN": "no botão", "SB": "small blind", "BB": "big blind"}


def story_question(h, path):
    img = felt_glow(Image.new("RGB", STORY, BG))
    d = ImageDraw.Draw(img)
    brandbar(d)
    center(d, 300, "O QUE VOCÊ", sg(124, 700), TITLE)
    center(d, 430, "FAZ?", sg(124, 700), GREEN)
    hand_cards(img, h["hand"], 860)
    ctx = f'{h["pos"]} · {POS_NAME[h["pos"]]} · 100BB'
    center(d, 1160, ctx, inter(42, 500), SUBTLE)
    center(d, 1250, "Ninguém entrou antes de você", inter(38, 400), SUBTLE)
    center(d, 1420, "VOTE AÍ", inter(44, 600), TITLE)
    cx = STORY[0] / 2  # seta desenhada (nenhuma fonte local tem emoji)
    d.polygon([(cx - 26, 1500), (cx + 26, 1500), (cx, 1536)], fill=GREEN)
    img.save(path, quality=95)


def story_answer(h, path):
    img = felt_glow(Image.new("RGB", STORY, BG))
    d = ImageDraw.Draw(img)
    brandbar(d)
    hand_cards(img, h["hand"], 470, 0.62)
    is_fold = h["action"] == "FOLD"
    label = "FOLD" if is_fold else "RAISE"
    color = RED if is_fold else PURPLE
    center(d, 760, "resposta", inter(40, 500), SUBTLE)
    center(d, 820, label, sg(150, 700), color)
    y = 1060
    for line in wrap(d, h["exp"], inter(46, 400), 860):
        center(d, y, line, inter(46, 400), TITLE)
        y += 64
    y += 40
    d.rounded_rectangle([140, y, 940, y + 130], radius=32, fill=CARD_BG)
    center(d, y + 26, "Treine de graça no PokerPath", inter(40, 600), TITLE)
    center(d, y + 76, "link na bio", inter(34, 400), GREEN)
    img.save(path, quality=95)


# ── Capas de destaque: um naipe por assunto ─────────────────────────────
def _ink(suit, size):
    """Pixels pintados por um naipe num dado corpo — base da normalização."""
    f = suit_font(size)
    probe = Image.new("L", (size * 2, size * 2), 0)
    ImageDraw.Draw(probe).text((size // 2, size // 2), suit, font=f, fill=255)
    return sum(probe.histogram()[200:]), probe.getbbox()


def highlight_suit(suit, path, target_ink=118_000):
    """Fundo branco, naipe verde. O Instagram corta um CÍRCULO do centro e o
    exibe com ~60px — por isso o naipe é grande e não há texto (some no
    tamanho real). O branco contrasta com a foto de perfil, que é verde.

    Cada naipe é escalado para pintar a MESMA área: no mesmo corpo de fonte o
    ouros sai bem menor que o paus, e a fileira de destaques ficaria irregular.
    """
    base = 400
    ink, _ = _ink(suit, base)
    size = max(60, int(base * (target_ink / ink) ** 0.5))

    img = Image.new("RGB", STORY, (255, 255, 255))
    d = ImageDraw.Draw(img)
    f = suit_font(size)
    bb = d.textbbox((0, 0), suit, font=f)
    d.text((STORY[0] / 2 - (bb[2] - bb[0]) / 2 - bb[0],
            STORY[1] / 2 - (bb[3] - bb[1]) / 2 - bb[1]), suit, font=f, fill=BRAND)
    img.save(path, quality=95)


def main():
    os.makedirs(os.path.join(OUT, "destaques"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "stories"), exist_ok=True)
    hands = json.load(open(os.path.join(ROOT, "brand-hands.json"), encoding="utf-8"))
    by = {h["label"]: h for h in hands}
    quiz = [by[k] for k in ["KJo", "A9s", "T9s", "77", "QJo", "99"] if k in by]

    for i, h in enumerate(quiz, 1):
        story_question(h, os.path.join(OUT, "stories", f"{i:02d}-{h['label']}-pergunta.png"))
        story_answer(h, os.path.join(OUT, "stories", f"{i:02d}-{h['label']}-resposta.png"))

    # Um naipe por assunto. ♠ é a marca (vai em "Comece aqui", o primeiro que
    # o visitante abre); os outros seguem a ordem natural do baralho.
    dest = os.path.join(OUT, "destaques")
    for old in os.listdir(dest):
        os.remove(os.path.join(dest, old))
    for fname, suit in [("01-comece-espadas.png", "♠"), ("02-maos-copas.png", "♥"),
                        ("03-dicas-ouros.png", "♦"), ("04-app-paus.png", "♣")]:
        highlight_suit(suit, os.path.join(dest, fname))

    print(f"quizzes: {len(quiz)*2} imagens | destaques: 4 (um por naipe)")


if __name__ == "__main__":
    main()
