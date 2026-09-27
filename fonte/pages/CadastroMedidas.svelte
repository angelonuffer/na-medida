<script>
  import { untrack } from 'svelte';
  import { adicionarMedida, atualizarMedida } from '../db.js';

  let { medida = null, onSalvar, onVoltar } = $props();
  let data = $state(untrack(() => medida?.data ?? formatarDataLocal(new Date())));
  let peso = $state(untrack(() => medida?.peso?.toString() ?? ''));
  let alturaCm = $state(untrack(() => medida?.alturaCm?.toString() ?? ''));
  let imc = $derived(
    Number(peso) > 0 && Number(alturaCm) > 0
      ? (Number(peso) / (Number(alturaCm) / 100) ** 2).toFixed(2)
      : ''
  );
  const faixasImc = [
    { id: 'baixo', nome: 'Baixo peso', intervalo: '< 18,5' },
    { id: 'adequado', nome: 'Adequado', intervalo: '18,5–24,9' },
    { id: 'sobrepeso', nome: 'Sobrepeso', intervalo: '25–29,9' },
    { id: 'obesidade-1', nome: 'Obesidade I', intervalo: '30–34,9' },
    { id: 'obesidade-2', nome: 'Obesidade II', intervalo: '35–39,9' },
    { id: 'obesidade-3', nome: 'Obesidade III', intervalo: '≥ 40' }
  ];
  let faixaImcAtiva = $derived.by(() => {
    const valor = Number(imc);
    if (!valor) return '';
    if (valor < 18.5) return 'baixo';
    if (valor < 25) return 'adequado';
    if (valor < 30) return 'sobrepeso';
    if (valor < 35) return 'obesidade-1';
    if (valor < 40) return 'obesidade-2';
    return 'obesidade-3';
  });

  function formatarDataLocal(valor) {
    const ano = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const dia = String(valor.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function formatarNumero(valor, maximoDecimais = 2) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maximoDecimais }).format(Number(valor));
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

  let recomendacoes = $derived.by(() => calcularRecomendacoes(peso, alturaCm));

  async function salvar(event) {
    event.preventDefault();
    const registro = {
      data,
      peso: Number(peso),
      alturaCm: Number(alturaCm),
      imc: Number(imc)
    };
    if (medida) {
      await atualizarMedida(medida.id, registro);
    } else {
      await adicionarMedida(registro);
    }
    onSalvar();
  }
</script>

<section id="cadastro-medidas" class="page-section active">
  <h1>{medida ? 'Editar registro' : 'Registrar medidas'}</h1>
  <p>Informe a data, o peso e a altura.</p>

  <form class="form-medidas" onsubmit={salvar}>
    <div class="form-row">
      <label for="data-medidas">Data</label>
      <input id="data-medidas" type="date" bind:value={data} required />
    </div>

    <div class="form-row">
      <label for="valor-peso">Peso (kg)</label>
      <input id="valor-peso" type="number" min="0.01" step="0.01" bind:value={peso} required />
    </div>

    <div class="form-row">
      <label for="altura-cm">Altura (cm)</label>
      <input id="altura-cm" type="number" min="1" step="0.1" bind:value={alturaCm} required />
    </div>

    <div class="form-row">
      <label for="valor-imc">IMC</label>
      <input id="valor-imc" type="number" value={imc} step="0.01" readonly aria-readonly="true" />
    </div>

    <div class="faixa-imc" aria-label="Faixas de classificação">
      <div class="faixa-imc-barra" role="list" aria-label="Categorias">
        {#each faixasImc as faixa (faixa.id)}
          <div
            class="faixa-imc-item faixa-imc-{faixa.id}"
            class:ativa={faixaImcAtiva === faixa.id}
            role="listitem"
            aria-current={faixaImcAtiva === faixa.id ? 'true' : undefined}
          ></div>
        {/each}
      </div>
      <div class="faixa-imc-legenda">
        {#each faixasImc as faixa (faixa.id)}
          <div class="faixa-imc-legenda-item" class:ativa={faixaImcAtiva === faixa.id}>
            <span>{faixa.nome}</span>
            <small>{faixa.intervalo}</small>
          </div>
        {/each}
      </div>
      {#if faixaImcAtiva}
        <p class="faixa-imc-status" aria-live="polite">
          Classificação: {faixasImc.find((faixa) => faixa.id === faixaImcAtiva).nome}
        </p>
      {/if}
    </div>

    {#if recomendacoes.length}
      <section class="recomendacoes-diarias" aria-labelledby="titulo-recomendacoes">
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

    <button type="submit" class="btn-salvar">{medida ? 'Salvar alterações' : 'Salvar dados'}</button>
    <button type="button" class="btn-voltar" onclick={onVoltar}>Voltar às medidas</button>
  </form>
</section>