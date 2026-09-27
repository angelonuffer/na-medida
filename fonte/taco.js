import dadosTaco from './taco.json';

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function arredondarDecimal(valor) {
  return Math.round((numero(valor) + Number.EPSILON) * 10) / 10;
}

export const alimentosTaco = dadosTaco.map((alimento) => ({
  id: `taco-${alimento.id}`,
  nome: alimento.description.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim(),
  tabelaNutricional: {
    valorEnergetico: Math.round(numero(alimento.energy_kcal)),
    gorduras: arredondarDecimal(alimento.lipid_g),
    carboidratos: arredondarDecimal(alimento.carbohydrate_g),
    proteinas: arredondarDecimal(alimento.protein_g),
    fibras: arredondarDecimal(alimento.fiber_g)
  }
}));