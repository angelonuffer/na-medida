<script>
  import { onMount } from 'svelte';
  import { listarAlimentos, removerAlimento } from '../db.js';

  let { onCadastrar, onSelecionar } = $props();
  let alimentos = $state([]);

  onMount(async () => {
    await carregarAlimentos();
  });

  async function carregarAlimentos() {
    alimentos = await listarAlimentos();
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
  <button class="btn-cadastrar" onclick={onCadastrar}>
    <span class="material-symbols-outlined">add_circle</span>
    <span>Cadastrar alimento</span>
  </button>

  <div class="lista-alimentos">
    {#if alimentos.length === 0}
      <div class="content-placeholder">Nenhum alimento cadastrado.</div>
    {:else}
      {#each alimentos as item (item.id)}
        <div
          class="card-alimento"
          role="button"
          tabindex="0"
          onclick={() => onSelecionar(item)}
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelecionar(item);
            }
          }}
        >
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
          <button
            class="btn-excluir"
            onclick={(event) => {
              event.stopPropagation();
              excluirAlimento(item.id);
            }}
          >
            <span class="material-symbols-outlined">delete</span>
            <span>Excluir</span>
          </button>
        </div>
      {/each}
    {/if}
  </div>
</section>