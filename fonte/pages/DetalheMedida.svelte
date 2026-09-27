<script>
  let { medida, onVoltar } = $props();

  function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarNumero(valor) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(valor));
  }
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
</section>
