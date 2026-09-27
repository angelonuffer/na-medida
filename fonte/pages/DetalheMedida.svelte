<script>
  let { medida, onVoltar, onEditar } = $props();

  function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarNumero(valor, maximoDecimais = 2) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maximoDecimais }).format(Number(valor));
  }

  function formatarDataHora(dataHora) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dataHora));
  }

  function calcularRecomendacoes(pesoInformado, alturaInformada) {
    const peso = Number(pesoInformado);
    const altura = Number(alturaInformada);

    if (!peso || !altura) return [];

    const alturaMetros = altura / 100;
    const imc = peso / (alturaMetros * alturaMetros);
    const energiaMin = Math.round(peso * (imc < 25 ? 25 : imc < 30 ? 27 : 23));
    const energiaMax = Math.round(peso * (imc < 25 ? 32 : imc < 30 ? 34 : 30));

    return [
      { nome: 'Valor energético', unidade: 'kcal', minimo: energiaMin, maximo: energiaMax },
      { nome: 'Gorduras', unidade: 'g', minimo: Number((peso * 0.6).toFixed(1)), maximo: Number((peso * 0.9).toFixed(1)) },
      { nome: 'Carboidratos', unidade: 'g', minimo: Number((peso * 2.5).toFixed(1)), maximo: Number((peso * 4).toFixed(1)) },
      { nome: 'Proteínas', unidade: 'g', minimo: Number((peso * 1.2).toFixed(1)), maximo: Number((peso * 1.8).toFixed(1)) },
      { nome: 'Fibras', unidade: 'g', minimo: Number(Math.max(14, peso * 0.2).toFixed(1)), maximo: Number(Math.max(22, peso * 0.3).toFixed(1)) }
    ];
  }

  const recomendacoes = $derived.by(() => calcularRecomendacoes(medida?.peso, medida?.alturaCm));
</script>

<section id="detalhe-medida" class="page-section active">
  <button class="btn-voltar" onclick={onVoltar}>
    <span class="material-symbols-outlined">arrow_back</span>
    <span>Voltar para medidas</span>
  </button>

  <div class="detalhe-cabecalho">
    <div>
      <h1>{formatarData(medida.data)}</h1>
      <p>Registro de medidas</p>
    </div>
  </div>

  <button class="btn-salvar btn-editar-medida" type="button" onclick={onEditar}>
    <span class="material-symbols-outlined">edit</span>
    <span>Editar registro</span>
  </button>

  <section class="detalhe-nutricao" aria-labelledby="titulo-medida">
    <h2 id="titulo-medida">Valores registrados</h2>
    <dl>
      <div><dt>Peso</dt><dd>{formatarNumero(medida.peso)} kg</dd></div>
      {#if medida.alturaCm}
        <div><dt>Altura</dt><dd>{formatarNumero(medida.alturaCm / 100)} m</dd></div>
      {/if}
      {#if medida.imc}
        <div><dt>IMC</dt><dd>IMC {formatarNumero(medida.imc)}</dd></div>
      {/if}
    </dl>
  </section>

  {#if recomendacoes.length}
    <section class="detalhe-nutricao recomendacoes-diarias" aria-labelledby="titulo-recomendacoes">
      <h2 id="titulo-recomendacoes">Faixas diárias recomendadas</h2>
      <dl class="lista-recomendacoes">
        {#each recomendacoes as item}
          <div class="recomendacao-item">
            <dt>{item.nome}</dt>
            <dd>
              <span>Mín. {formatarNumero(item.minimo, item.unidade === 'kcal' ? 0 : 1)} {item.unidade}</span>
              <span>Máx. {formatarNumero(item.maximo, item.unidade === 'kcal' ? 0 : 1)} {item.unidade}</span>
            </dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}

  {#if medida.historico?.length}
    <section class="detalhe-nutricao historico-medida" aria-labelledby="titulo-historico-medida">
      <h2 id="titulo-historico-medida">Versões anteriores</h2>
      <dl>
        {#each [...medida.historico].reverse() as versao, indice}
          <div class="versao-medida">
            <dt>Versão {medida.historico.length - indice}</dt>
            <dd>
              <span>{formatarData(versao.data)}: {formatarNumero(versao.peso)} kg</span>
              {#if versao.alturaCm}
                <span>{formatarNumero(versao.alturaCm / 100)} m</span>
              {/if}
              <time datetime={versao.editadoEm}>Alterada em {formatarDataHora(versao.editadoEm)}</time>
            </dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}
</section>
