<script>
  import { onDestroy, onMount } from 'svelte';

  let { consumo, onVoltar, onSalvar } = $props();
  let imagemUrl = $state('');
  let editando = $state(false);
  let salvando = $state(false);
  let erro = $state('');
  let dataHoraEditada = $state('');
  let massaEditada = $state('');

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

  function iniciarEdicao() {
    dataHoraEditada = consumo.dataHora;
    massaEditada = String(consumo.massa);
    erro = '';
    editando = true;
  }

  async function salvarEdicao(event) {
    event.preventDefault();
    salvando = true;
    erro = '';

    try {
      await onSalvar({
        dataHora: dataHoraEditada,
        massa: Number(massaEditada)
      });
      editando = false;
    } catch (error) {
      erro = error instanceof Error ? error.message : 'Não foi possível salvar as alterações.';
    } finally {
      salvando = false;
    }
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

  {#if editando}
    <form class="form-edicao-consumo" onsubmit={salvarEdicao}>
      <div class="form-row">
        <label for="data-hora-edicao-consumo">Data e hora</label>
        <input id="data-hora-edicao-consumo" type="datetime-local" bind:value={dataHoraEditada} required />
      </div>
      <div class="form-row">
        <label for="massa-edicao-consumo">Massa (g)</label>
        <input id="massa-edicao-consumo" type="number" min="0.01" step="0.01" bind:value={massaEditada} required />
      </div>
      {#if erro}
        <p class="erro" role="alert">{erro}</p>
      {/if}
      <div class="acoes-edicao-consumo">
        <button class="btn-salvar" type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button class="btn-voltar" type="button" onclick={() => { editando = false; }} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </form>
  {:else}
    <button class="btn-salvar btn-editar-medida" type="button" onclick={iniciarEdicao}>
      <span class="material-symbols-outlined">edit</span>
      <span>Editar consumo</span>
    </button>
  {/if}

  <section class="detalhe-nutricao" aria-labelledby="titulo-detalhe-consumo">
    <h2 id="titulo-detalhe-consumo">Dados do consumo</h2>
    <dl>
      <div><dt>Data e hora</dt><dd>{formatarDataHora(consumo.dataHora)}</dd></div>
      <div><dt>Massa</dt><dd>{formatarMassa(consumo.massa)} g</dd></div>
    </dl>
  </section>

  {#if consumo.historico?.length}
    <section class="detalhe-nutricao historico-medida" aria-labelledby="titulo-historico-consumo">
      <h2 id="titulo-historico-consumo">Histórico de alterações</h2>
      <dl>
        {#each [...consumo.historico].reverse() as versao, indice}
          <div class="versao-medida">
            <dt>Versão {consumo.historico.length - indice}</dt>
            <dd>
              <span>{versao.alimentoNome ?? consumo.alimentoNome}</span>
              <span>{formatarDataHora(versao.dataHora)}: {formatarMassa(versao.massa)} g</span>
              <time datetime={versao.editadoEm}>Alterada em {formatarDataHora(versao.editadoEm)}</time>
            </dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}
</section>
