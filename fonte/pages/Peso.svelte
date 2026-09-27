<script>
  import { onMount } from 'svelte';
  import { listarPesos } from '../db.js';

  let { onCadastrar } = $props();
  let registros = $state([]);

  onMount(async () => {
    registros = await listarPesos();
  });

  function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarPeso(peso) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(peso));
  }
</script>

<section id="peso" class="page-section active">
  <h1>Histórico de peso</h1>
  <p>Acompanhe seus registros de peso.</p>

  <button class="btn-cadastrar" aria-label="Registrar peso" onclick={onCadastrar}>
    <span class="material-symbols-outlined">add</span>
    <span>Registrar dados</span>
  </button>

  {#if registros.length === 0}
    <div class="content-placeholder">Nenhum peso registrado.</div>
  {:else}
    <div class="lista-pesos" aria-label="Histórico de peso">
      {#each registros as registro (registro.id)}
        <article class="card-peso">
          <time datetime={registro.data}>{formatarData(registro.data)}</time>
          <strong>{formatarPeso(registro.peso)} kg</strong>
        </article>
      {/each}
    </div>
  {/if}
</section>