import { AVATAR_MAX_CHARS } from '@pokerpath/shared';

/**
 * Converte a foto escolhida num data URI pequeno, NO APARELHO.
 *
 * A foto da galeria tem vários megabytes; o que vai para o servidor é um
 * quadrado de 96px em JPEG (~4KB). Reduzir antes de enviar é o que torna
 * viável guardar no banco: nada de upload gigante, nada de bucket.
 *
 * O recorte é central e quadrado — a foto aparece sempre dentro de um
 * círculo, então esticar seria pior que cortar.
 */
const SIZE = 96;

export async function fileToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.');

  const bitmap = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem.');

  // recorte central quadrado
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, SIZE, SIZE);
  if ('close' in bitmap) (bitmap as ImageBitmap).close();

  // Cai a qualidade até caber no limite. Fotos com muito detalhe (ruído,
  // textura) passam do teto em q=0.75 — sem este laço, o servidor recusaria.
  for (const q of [0.75, 0.6, 0.45, 0.3]) {
    const url = canvas.toDataURL('image/jpeg', q);
    if (url.length <= AVATAR_MAX_CHARS) return url;
  }
  throw new Error('Não conseguimos comprimir essa imagem. Tente outra.');
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* Safari antigo falha com alguns formatos — cai no <img> abaixo. */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
