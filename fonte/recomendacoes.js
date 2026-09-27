const definicoes = [
  { chave: 'valorEnergetico', nome: 'Valor energético', unidade: 'kcal' },
  { chave: 'gorduras', nome: 'Gorduras', unidade: 'g' },
  { chave: 'carboidratos', nome: 'Carboidratos', unidade: 'g' },
  { chave: 'proteinas', nome: 'Proteínas', unidade: 'g' },
  { chave: 'fibras', nome: 'Fibras', unidade: 'g' }
];

export function calcularRecomendacoes(pesoInformado, alturaInformada) {
  const peso = Number(pesoInformado);
  const altura = Number(alturaInformada);

  if (!peso || !altura) return [];

  const alturaMetros = altura / 100;
  const imc = peso / (alturaMetros * alturaMetros);
  const energiaMin = Math.round(peso * (imc < 25 ? 25 : imc < 30 ? 27 : 23));
  const energiaMax = Math.round(peso * (imc < 25 ? 32 : imc < 30 ? 34 : 30));

  return [
    { ...definicoes[0], minimo: energiaMin, maximo: energiaMax },
    { ...definicoes[1], minimo: Number((peso * 0.6).toFixed(1)), maximo: Number((peso * 0.9).toFixed(1)) },
    { ...definicoes[2], minimo: Number((peso * 2.5).toFixed(1)), maximo: Number((peso * 4).toFixed(1)) },
    { ...definicoes[3], minimo: Number((peso * 1.2).toFixed(1)), maximo: Number((peso * 1.8).toFixed(1)) },
    { ...definicoes[4], minimo: Number(Math.max(14, peso * 0.2).toFixed(1)), maximo: Number(Math.max(22, peso * 0.3).toFixed(1)) }
  ];
}

export function calcularRecomendacoesMedias(medidas) {
  const recomendacoes = medidas.flatMap((medida) => calcularRecomendacoes(medida.peso, medida.alturaCm));
  if (recomendacoes.length === 0) return calcularRecomendacoes(70, 170);

  return definicoes.map((definicao) => {
    const relacionadas = recomendacoes.filter((item) => item.chave === definicao.chave);
    const casasDecimais = definicao.unidade === 'kcal' ? 0 : 1;
    const media = (propriedade) => Number((relacionadas.reduce((total, item) => total + item[propriedade], 0) / relacionadas.length).toFixed(casasDecimais));
    return { ...definicao, minimo: media('minimo'), maximo: media('maximo') };
  });
}