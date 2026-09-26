<script>
  import { onMount } from 'svelte';
  import { listarAlimentos } from '../db.js';

  let { onSelecionar } = $props();
  let alimentos = $state([]);

  onMount(async () => {
    alimentos = await listarAlimentos({ arquivados: true });
  });

  function fotoUrl(item) {
    return item.foto ? URL.createObjectURL(item.foto) : '';
  }
</script>

<section id="arquivo" class="page-section active">
  <h1>Arquivo</h1>
  <p>Aqui ficam os alimentos arquivados.</p>

  <div class="lista-alimentos">
    {#if alimentos.length === 0}
      <div class="content-placeholder">Nenhum alimento arquivado.</div>
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
        </div>
      {/each}
    {/if}
  </div>
</section>