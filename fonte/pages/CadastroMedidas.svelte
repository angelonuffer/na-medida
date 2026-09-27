<script>
  import { adicionarMedida } from '../db.js';

  let { onSalvar, onVoltar } = $props();
  let data = $state(formatarDataLocal(new Date()));
  let peso = $state('');
  let alturaCm = $state('');
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

  async function salvar(event) {
    event.preventDefault();
    await adicionarMedida({
      data,
      peso: Number(peso),
      alturaCm: Number(alturaCm),
      imc: Number(imc)
    });
    onSalvar();
  }
</script>

<section id="cadastro-medidas" class="page-section active">
  <h1>Registrar medidas</h1>
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

    <button type="submit" class="btn-salvar">Salvar dados</button>
    <button type="button" class="btn-voltar" onclick={onVoltar}>Voltar às medidas</button>
  </form>
</section>