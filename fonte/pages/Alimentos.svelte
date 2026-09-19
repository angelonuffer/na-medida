<script>
  import { onMount } from 'svelte';
  import { adicionarAlimento, listarAlimentos, removerAlimento } from '../db.js';

  let nome = $state('');
  let descricao = $state('');
  let foto = $state(null);
  let fotoPreview = $state('');
  let valorEnergetico = $state('');
  let gorduras = $state('');
  let carboidratos = $state('');
  let proteinas = $state('');
  let fibras = $state('');

  let alimentos = $state([]);
  let erro = $state('');

  onMount(async () => {
    await carregarAlimentos();
  });

  async function carregarAlimentos() {
    alimentos = await listarAlimentos();
  }

  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0];
    foto = arquivo ?? null;
    fotoPreview = arquivo ? URL.createObjectURL(arquivo) : '';
  }

  function limparFormulario() {
    nome = '';
    descricao = '';
    foto = null;
    fotoPreview = '';
    valorEnergetico = '';
    gorduras = '';
    carboidratos = '';
    proteinas = '';
    fibras = '';
    erro = '';
  }

  async function salvarAlimento(event) {
    event.preventDefault();

    if (!nome.trim()) {
      erro = 'Informe o nome do alimento.';
      return;
    }

    await adicionarAlimento({
      nome: nome.trim(),
      descricao: descricao.trim(),
      foto,
      tabelaNutricional: {
        valorEnergetico: Number(valorEnergetico) || 0,
        gorduras: Number(gorduras) || 0,
        carboidratos: Number(carboidratos) || 0,
        proteinas: Number(proteinas) || 0,
        fibras: Number(fibras) || 0
      }
    });

    limparFormulario();
    await carregarAlimentos();
  }

  async function excluirAlimento(id) {
    await removerAlimento(id);
    await carregarAlimentos();
  }

  function fotoUrl(item) {
    return item.foto ? URL.createObjectURL(item.foto) : '';
  }
</script>

<section id="alimentos" class="page-section active">
  <h1>Alimentos</h1>
  <p>Aqui você pode gerenciar a base de dados de alimentos.</p>

  <form class="form-alimento" onsubmit={salvarAlimento}>
    <div class="form-row">
      <label for="nome">Nome</label>
      <input id="nome" type="text" bind:value={nome} placeholder="Ex: Arroz branco cozido" />
    </div>

    <div class="form-row">
      <label for="descricao">Descrição</label>
      <textarea id="descricao" bind:value={descricao} placeholder="Descrição do alimento"></textarea>
    </div>

    <div class="form-row">
      <label for="foto">Foto</label>
      <input id="foto" type="file" accept="image/*" onchange={selecionarFoto} />
      {#if fotoPreview}
        <img class="foto-preview" src={fotoPreview} alt="Pré-visualização da foto" />
      {/if}
    </div>

    <fieldset class="tabela-nutricional">
      <legend>Tabela nutricional (por 100g)</legend>

      <div class="form-row">
        <label for="valorEnergetico">Valor energético (kcal)</label>
        <input id="valorEnergetico" type="number" min="0" step="0.1" bind:value={valorEnergetico} />
      </div>

      <div class="form-row">
        <label for="gorduras">Gorduras (g)</label>
        <input id="gorduras" type="number" min="0" step="0.1" bind:value={gorduras} />
      </div>

      <div class="form-row">
        <label for="carboidratos">Carboidratos (g)</label>
        <input id="carboidratos" type="number" min="0" step="0.1" bind:value={carboidratos} />
      </div>

      <div class="form-row">
        <label for="proteinas">Proteínas (g)</label>
        <input id="proteinas" type="number" min="0" step="0.1" bind:value={proteinas} />
      </div>

      <div class="form-row">
        <label for="fibras">Fibras (g)</label>
        <input id="fibras" type="number" min="0" step="0.1" bind:value={fibras} />
      </div>
    </fieldset>

    {#if erro}
      <p class="erro">{erro}</p>
    {/if}

    <button type="submit" class="btn-salvar">Salvar alimento</button>
  </form>

  <div class="lista-alimentos">
    {#if alimentos.length === 0}
      <div class="content-placeholder">Nenhum alimento cadastrado.</div>
    {:else}
      {#each alimentos as item (item.id)}
        <div class="card-alimento">
          {#if item.foto}
            <img class="card-foto" src={fotoUrl(item)} alt={item.nome} />
          {/if}
          <div class="card-info">
            <h3>{item.nome}</h3>
            <p>{item.descricao}</p>
            <ul class="card-nutrientes">
              <li>Energético: {item.tabelaNutricional.valorEnergetico} kcal</li>
              <li>Gorduras: {item.tabelaNutricional.gorduras} g</li>
              <li>Carboidratos: {item.tabelaNutricional.carboidratos} g</li>
              <li>Proteínas: {item.tabelaNutricional.proteinas} g</li>
              <li>Fibras: {item.tabelaNutricional.fibras} g</li>
            </ul>
          </div>
          <button class="btn-excluir" onclick={() => excluirAlimento(item.id)}>Excluir</button>
        </div>
      {/each}
    {/if}
  </div>
</section>