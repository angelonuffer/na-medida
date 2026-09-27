<script>
  import { onMount } from 'svelte';
  import { listarMedidas } from '../db.js';

  let { onCadastrar } = $props();
  let registros = $state([]);

  onMount(async () => {
    registros = await listarMedidas();
  });

  function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarNumero(valor) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(valor));
  }
</script>

<section id="medidas" class="page-section active">
  <h1>Histórico de medidas</h1>
  <p>Acompanhe seus registros de peso, altura e IMC.</p>

  <button class="btn-cadastrar" aria-label="Registrar medidas" onclick={onCadastrar}>
    <span class="material-symbols-outlined">add</span>
    <span>Registrar dados</span>
  </button>

  {#if registros.length === 0}
    <div class="content-placeholder">Nenhuma medida registrada.</div>
  {:else}
    <div class="lista-medidas" aria-label="Histórico de medidas">
      {#each registros as registro (registro.id)}
        <article class="card-medida">
          <time datetime={registro.data}>{formatarData(registro.data)}</time>
          <div class="valores-medida">
            <strong>{formatarNumero(registro.peso)} kg</strong>
            {#if registro.alturaCm}
              <span>{formatarNumero(registro.alturaCm / 100)} m</span>
            {/if}
            {#if registro.imc}
              <span>IMC {formatarNumero(registro.imc)}</span>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>