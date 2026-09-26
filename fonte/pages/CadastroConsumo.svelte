<script>
  import { onMount } from 'svelte';
  import { adicionarConsumo, listarAlimentos } from '../db.js';

  let { onSalvar, onVoltar } = $props();
  let alimentos = $state([]);
  let dataHora = $state(formatarDataHoraLocal(new Date()));
  let alimentoId = $state('');
  let massa = $state('');
  let erro = $state('');

  onMount(async () => {
    alimentos = await listarAlimentos();
  });

  function formatarDataHoraLocal(data) {
    const deslocamento = data.getTimezoneOffset() * 60_000;
    return new Date(data.getTime() - deslocamento).toISOString().slice(0, 16);
  }

  async function salvarConsumo(event) {
    event.preventDefault();
    const alimento = alimentos.find((item) => String(item.id) === alimentoId);
    if (!alimento) {
      erro = 'Selecione um alimento cadastrado.';
      return;
    }

    await adicionarConsumo({
      dataHora,
      alimentoId: alimento.id,
      alimentoNome: alimento.nome,
      massa: Number(massa)
    });
    onSalvar();
  }
</script>

<section id="cadastro-consumo" class="page-section active">
  <h1>Cadastrar consumo</h1>
  <p>Informe os dados do alimento consumido.</p>

  <form class="form-consumo" onsubmit={salvarConsumo}>
    <div class="form-row">
      <label for="data-hora-consumo">Data e hora</label>
      <input id="data-hora-consumo" type="datetime-local" bind:value={dataHora} required />
    </div>

    <div class="form-row">
      <label for="alimento-consumo">Alimento</label>
      <select id="alimento-consumo" bind:value={alimentoId} required>
        <option value="" disabled>Selecione um alimento</option>
        {#each alimentos as alimento (alimento.id)}
          <option value={String(alimento.id)}>{alimento.nome}</option>
        {/each}
      </select>
      {#if alimentos.length === 0}
        <small>Nenhum alimento cadastrado.</small>
      {/if}
    </div>

    <div class="form-row">
      <label for="massa-consumo">Massa (g)</label>
      <input id="massa-consumo" type="number" min="0.01" step="0.01" bind:value={massa} required />
    </div>

    {#if erro}
      <p class="erro">{erro}</p>
    {/if}

    <button type="submit" class="btn-salvar">Salvar consumo</button>
    <button type="button" class="btn-voltar" onclick={onVoltar}>Voltar para Consumo</button>
  </form>
</section>