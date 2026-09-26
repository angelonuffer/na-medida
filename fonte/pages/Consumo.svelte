<script>
  import { onMount } from 'svelte';
  import { listarConsumos } from '../db.js';

  let { onCadastrar } = $props();
  let consumos = $state([]);

  onMount(async () => {
    consumos = await listarConsumos();
  });

  function formatarDataHora(dataHora) {
    const [data, hora] = dataHora.split('T');
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano} às ${hora}`;
  }
</script>

<section id="consumo" class="page-section active">
  <h1>Consumo</h1>
  <p>Aqui você pode gerenciar e planejar seu consumo.</p>
  <button class="btn-cadastrar" aria-label="Cadastrar consumo" onclick={onCadastrar}>
    <span class="material-symbols-outlined">add</span>
    <span>Consumo</span>
  </button>
  {#if consumos.length === 0}
    <div class="content-placeholder"></div>
  {:else}
    <div class="lista-consumos">
      {#each consumos as consumo (consumo.id)}
        <article class="card-consumo">
          <div>
            <h2>{consumo.alimentoNome}</h2>
            <p>{formatarDataHora(consumo.dataHora)}</p>
          </div>
          <strong>{consumo.massa} g</strong>
        </article>
      {/each}
    </div>
  {/if}
</section>