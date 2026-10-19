<script>
  import { onDestroy, onMount } from 'svelte';

  let { consumo, onVoltar } = $props();
  let imagemUrl = $state('');

  onMount(() => {
    if (consumo.imagem) {
      imagemUrl = URL.createObjectURL(consumo.imagem);
    }
  });

  onDestroy(() => {
    if (imagemUrl) URL.revokeObjectURL(imagemUrl);
  });

  function formatarDataHora(dataHora) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      .format(new Date(dataHora));
  }

  function formatarMassa(massa) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(massa));
  }
</script>

<section id="detalhe-consumo" class="page-section active">
  <button class="btn-voltar" type="button" onclick={onVoltar}>
    <span class="material-symbols-outlined">arrow_back</span>
    <span>Voltar para Consumo</span>
  </button>

  <div class="detalhe-cabecalho">
    {#if imagemUrl}
      <img class="detalhe-foto" src={imagemUrl} alt="Imagem registrada do consumo de {consumo.alimentoNome}" />
    {/if}
    <div>
      <h1>{consumo.alimentoNome}</h1>
      <p>Consumo registrado</p>
    </div>
  </div>

  <section class="detalhe-nutricao" aria-labelledby="titulo-detalhe-consumo">
    <h2 id="titulo-detalhe-consumo">Dados do consumo</h2>
    <dl>
      <div><dt>Data e hora</dt><dd>{formatarDataHora(consumo.dataHora)}</dd></div>
      <div><dt>Massa</dt><dd>{formatarMassa(consumo.massa)} g</dd></div>
    </dl>
  </section>
</section>
