<script>
  import { adicionarPeso } from '../db.js';

  let { onSalvar, onVoltar } = $props();
  let data = $state(formatarDataLocal(new Date()));
  let peso = $state('');

  function formatarDataLocal(valor) {
    const ano = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const dia = String(valor.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  async function salvar(event) {
    event.preventDefault();
    await adicionarPeso({ data, peso: Number(peso) });
    onSalvar();
  }
</script>

<section id="cadastro-peso" class="page-section active">
  <h1>Registrar peso</h1>
  <p>Informe a data e o peso em quilogramas.</p>

  <form class="form-peso" onsubmit={salvar}>
    <div class="form-row">
      <label for="data-peso">Data</label>
      <input id="data-peso" type="date" bind:value={data} required />
    </div>

    <div class="form-row">
      <label for="valor-peso">Peso (kg)</label>
      <input id="valor-peso" type="number" min="0.01" step="0.01" bind:value={peso} required />
    </div>

    <button type="submit" class="btn-salvar">Salvar dados</button>
    <button type="button" class="btn-voltar" onclick={onVoltar}>Voltar ao histórico</button>
  </form>
</section>