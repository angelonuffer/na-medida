const nutrientes = [
  {
    chave: 'valorEnergetico',
    rotulos: ['valor energetico', 'energia', 'calorias']
  },
  { chave: 'gorduras', rotulos: ['gorduras totais', 'gorduras', 'lipidios'] },
  { chave: 'carboidratos', rotulos: ['carboidratos', 'hidratos de carbono'] },
  { chave: 'proteinas', rotulos: ['proteinas'] },
  { chave: 'fibras', rotulos: ['fibra alimentar', 'fibras', 'fibra'] }
];

function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}

function localizarRotulo(linha) {
  const normalizada = normalizarTexto(linha);
  let melhorCorrespondencia = null;

  for (const nutriente of nutrientes) {
    for (const rotulo of nutriente.rotulos) {
      const indice = normalizada.indexOf(rotulo);
      if (indice < 0 || (melhorCorrespondencia && indice >= melhorCorrespondencia.indice)) continue;
      melhorCorrespondencia = { chave: nutriente.chave, indice, fim: indice + rotulo.length };
    }
  }

  return melhorCorrespondencia;
}

function normalizarNumero(texto) {
  let numero = texto.replace(/[^\d,.-]/g, '');
  if (numero.includes(',')) {
    numero = numero.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}\.\d{3}$/.test(numero)) {
    numero = numero.replace('.', '');
  }

  const valor = Number(numero);
  return Number.isFinite(valor) && valor >= 0 ? String(valor) : null;
}

export async function prepararImagemParaOCR(arquivo, binarizar = false) {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(4, 3200 / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);

  const contexto = canvas.getContext('2d', { willReadFrequently: true });
  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = 'high';
  contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  imagem.close();

  const pixels = contexto.getImageData(0, 0, canvas.width, canvas.height);
  const dados = pixels.data;
  for (let indice = 0; indice < dados.length; indice += 4) {
    const cinza = 0.299 * dados[indice] + 0.587 * dados[indice + 1] + 0.114 * dados[indice + 2];
    const contraste = Math.max(0, Math.min(255, (cinza - 128) * 1.5 + 128));
    const valor = binarizar ? (contraste > 172 ? 255 : 0) : contraste;
    dados[indice] = valor;
    dados[indice + 1] = valor;
    dados[indice + 2] = valor;
  }
  contexto.putImageData(pixels, 0, 0);
  return canvas;
}

function localizarColunaCemGramas(linhas) {
  let melhorCorrespondencia = null;

  for (const linha of linhas) {
    const normalizada = normalizarTexto(linha);
    const colunas = [...normalizada.matchAll(/\b\d+(?:[.,]\d+)?\s*g\b|%\s*vd\b/g)];
    const indice = colunas.findIndex(([rotulo]) => /^100\s*g$/.test(rotulo));
    if (indice < 0 || (melhorCorrespondencia && colunas.length <= melhorCorrespondencia.quantidade)) continue;
    melhorCorrespondencia = { indice, quantidade: colunas.length };
  }

  return melhorCorrespondencia?.indice ?? null;
}

export function extrairValoresTabelaNutricional(texto) {
  const linhas = String(texto ?? '').split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean);
  const colunaCemGramas = localizarColunaCemGramas(linhas);
  if (colunaCemGramas === null) return {};

  const valores = {};

  for (let indice = 0; indice < linhas.length; indice += 1) {
    const rotulo = localizarRotulo(linhas[indice]);
    if (!rotulo || valores[rotulo.chave] !== undefined) continue;

    const linhaNormalizada = normalizarTexto(linhas[indice]);
    const numeros = linhaNormalizada.slice(rotulo.fim).match(/\d+(?:[.,]\d+)*|[.,]\d+/g);
    let valor = numeros?.map(normalizarNumero).filter((item) => item !== null)[colunaCemGramas];

    if (valor === undefined) {
      const proximaLinha = linhas[indice + 1];
      if (proximaLinha && !localizarRotulo(proximaLinha)) {
        const numerosProximaLinha = normalizarTexto(proximaLinha).match(/\d+(?:[.,]\d+)*|[.,]\d+/g);
        valor = numerosProximaLinha?.map(normalizarNumero).filter((item) => item !== null)[colunaCemGramas];
      }
    }

    if (valor !== undefined) valores[rotulo.chave] = valor;
  }

  return valores;
}