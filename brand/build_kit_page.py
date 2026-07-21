"""Monta uma página única com todas as artes embutidas (base64).

Serve para abrir no CELULAR e salvar as imagens direto — é de lá que se sobe
para o Instagram. Roda com:  python brand/build_kit_page.py
"""
import base64
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, "brand")
OUT = os.path.join(B, "kit.html")


def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def img_uri(path):
    return "data:image/png;base64," + b64(path)


def kb(path):
    return f"{os.path.getsize(path) / 1024:.0f} KB"


DEST = [
    ("01-comece-espadas.png", "Comece aqui", "♠", "O que é, pra quem é, como usar"),
    ("02-maos-copas.png", "Mãos", "♥", "Os quizzes: pergunta, enquete, resposta"),
    ("03-dicas-ouros.png", "Dicas", "♦", "Posição, ranges, pot odds, erros comuns"),
    ("04-app-paus.png", "O app", "♣", "Tour pelas telas e o link"),
]

QUIZ = [("KJo", "Fold"), ("A9s", "Fold"), ("T9s", "Raise"),
        ("77", "Raise"), ("QJo", "Fold"), ("99", "Raise")]


def card(src, name, meta, extra_class="", caption=""):
    # O href do download é preenchido por JS a partir do próprio <img>: embutir
    # o base64 duas vezes dobraria o tamanho da página à toa.
    return f"""<figure class="asset {extra_class}">
        <div class="shot"><img src="{src}" alt="{name}" loading="lazy" /></div>
        <figcaption>
          <span class="nm">{name}</span>
          <span class="meta">{meta}</span>
          {caption}
        </figcaption>
        <a class="dl" download="{name}">Baixar</a>
      </figure>"""


def main():
    font_uri = "data:font/ttf;base64," + b64(os.path.join(B, "fonts", "SpaceGrotesk.ttf"))
    logo = os.path.join(B, "logo-square-1080.png")

    dest_html = ""
    for fn, title, suit, desc in DEST:
        p = os.path.join(B, "instagram", "destaques", fn)
        dest_html += card(img_uri(p), fn, f"1080×1920 · {kb(p)}", "round",
                          f'<span class="tag"><b>{suit}</b> {title}</span>'
                          f'<span class="desc">{desc}</span>')

    story_html = ""
    for i, (hand, ans) in enumerate(QUIZ, 1):
        for kind in ("pergunta", "resposta"):
            fn = f"{i:02d}-{hand}-{kind}.png"
            p = os.path.join(B, "instagram", "stories", fn)
            if not os.path.exists(p):
                continue
            label = "pergunta + enquete" if kind == "pergunta" else f"resposta · {ans}"
            story_html += card(img_uri(p), fn, f"1080×1920 · {kb(p)}", "tall",
                               f'<span class="tag">{hand}</span>'
                               f'<span class="desc">{label}</span>')

    html = f"""<style>
  @font-face {{
    font-family: 'Space Grotesk';
    src: url({font_uri}) format('truetype');
    font-weight: 400 700; font-display: swap;
  }}
  :root {{
    --ground:#0A0D0B; --surface:#141916; --line:#29302C;
    --title:#F5F7F6; --muted:#848C87; --accent:#1FA463; --on-accent:#04120A;
  }}
  @media (prefers-color-scheme: light) {{
    :root {{
      --ground:#F6F8F6; --surface:#FFFFFF; --line:#DEE5E0;
      --title:#0F1511; --muted:#5C645E; --accent:#157A45; --on-accent:#FFFFFF;
    }}
  }}
  :root[data-theme="dark"] {{
    --ground:#0A0D0B; --surface:#141916; --line:#29302C;
    --title:#F5F7F6; --muted:#848C87; --accent:#1FA463; --on-accent:#04120A;
  }}
  :root[data-theme="light"] {{
    --ground:#F6F8F6; --surface:#FFFFFF; --line:#DEE5E0;
    --title:#0F1511; --muted:#5C645E; --accent:#157A45; --on-accent:#FFFFFF;
  }}

  body {{
    margin:0; background:var(--ground); color:var(--title);
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    line-height:1.55; -webkit-font-smoothing:antialiased;
  }}
  .wrap {{ max-width: 940px; margin:0 auto; padding: 40px 20px 80px; }}

  header {{ display:flex; align-items:center; gap:16px; padding-bottom:28px;
    border-bottom:1px solid var(--line); }}
  header img {{ width:64px; height:64px; border-radius:50%; flex:none; }}
  h1 {{ font-family:'Space Grotesk', system-ui, sans-serif; font-weight:700;
    font-size:clamp(1.35rem,4vw,1.75rem); margin:0; letter-spacing:-.02em;
    text-wrap:balance; }}
  header p {{ margin:2px 0 0; color:var(--muted); font-size:.92rem; }}

  .note {{ margin:26px 0 0; padding:14px 16px; background:var(--surface);
    border:1px solid var(--line); border-radius:12px; color:var(--muted);
    font-size:.9rem; }}
  .note b {{ color:var(--title); font-weight:600; }}

  section {{ margin-top:44px; }}
  h2 {{ font-family:'Space Grotesk', system-ui, sans-serif; font-weight:700;
    font-size:1.05rem; margin:0 0 4px; letter-spacing:.01em; }}
  .lead {{ margin:0 0 20px; color:var(--muted); font-size:.9rem; max-width:62ch; }}

  .grid {{ display:grid; gap:18px; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); }}

  .asset {{ margin:0; display:flex; flex-direction:column; gap:10px;
    background:var(--surface); border:1px solid var(--line);
    border-radius:14px; padding:14px; }}
  .shot {{ display:flex; justify-content:center; align-items:center; }}
  .asset.round .shot img {{ width:104px; height:104px; border-radius:50%;
    object-fit:cover; }}
  .asset.tall .shot img {{ width:100%; max-width:150px; border-radius:8px;
    border:1px solid var(--line); display:block; }}
  .asset:not(.round):not(.tall) .shot img {{ width:104px; height:104px;
    border-radius:50%; }}

  figcaption {{ display:flex; flex-direction:column; gap:2px; }}
  .tag {{ font-family:'Space Grotesk', system-ui, sans-serif; font-weight:700;
    font-size:.95rem; }}
  .tag b {{ color:var(--accent); }}
  .desc {{ color:var(--muted); font-size:.82rem; }}
  .nm {{ font-size:.74rem; color:var(--muted); font-variant-numeric:tabular-nums;
    word-break:break-all; }}
  .meta {{ font-size:.72rem; color:var(--muted); font-variant-numeric:tabular-nums; }}

  .dl {{ margin-top:auto; display:block; text-align:center; text-decoration:none;
    background:var(--accent); color:var(--on-accent); font-weight:650;
    font-size:.85rem; padding:9px 12px; border-radius:9px;
    transition: filter .15s ease; }}
  .dl:hover {{ filter:brightness(1.08); }}
  .dl:focus-visible {{ outline:2px solid var(--title); outline-offset:2px; }}
  @media (prefers-reduced-motion: reduce) {{ .dl {{ transition:none; }} }}
</style>

<div class="wrap">
  <header>
    <img src="{img_uri(logo)}" alt="PokerPath" />
    <div>
      <h1>Kit de artes — @pokerpathbrasil</h1>
      <p>Foto de perfil, destaques e stories. Todos em PNG, prontos pra subir.</p>
    </div>
  </header>

  <p class="note">
    <b>No celular:</b> toque em <b>Baixar</b>. Se o iPhone abrir a imagem em vez de
    salvar, segure o dedo nela e escolha <b>Adicionar às Fotos</b>.
  </p>

  <section>
    <h2>Foto de perfil</h2>
    <p class="lead">Feita a partir do vetor, com a espada centralizada — nada é
      cortado quando o Instagram recorta o círculo.</p>
    <div class="grid">
      {card(img_uri(logo), "logo-square-1080.png", f"1080×1080 · {kb(logo)}", "",
            '<span class="tag">Perfil</span><span class="desc">Foto da conta</span>')}
    </div>
  </section>

  <section>
    <h2>Destaques</h2>
    <p class="lead">Um naipe por assunto, em verde sobre branco. Estão mostrados
      já recortados em círculo, do jeito que aparecem no perfil. Crie na ordem
      inversa (♣ primeiro, ♠ por último) para a fileira ficar ♠ ♥ ♦ ♣.</p>
    <div class="grid">{dest_html}</div>
  </section>

  <section>
    <h2>Stories de quiz</h2>
    <p class="lead">Seis mãos, cada uma com pergunta e resposta. Poste a pergunta
      com a enquete <b>Fold / Call / Raise</b> — o rodapé da arte está livre pra
      ela — e a resposta no dia seguinte, junto do resultado da votação.</p>
    <div class="grid">{story_html}</div>
  </section>
</div>

<script>
  // Cada botão baixa a imagem do próprio card (o base64 vive só no <img>).
  for (const a of document.querySelectorAll('.asset .dl')) {{
    const img = a.parentElement.querySelector('img');
    if (img) a.href = img.src;
  }}
</script>
"""
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"{OUT}  ({os.path.getsize(OUT)/1024/1024:.1f} MB)")


if __name__ == "__main__":
    main()
