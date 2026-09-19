<script>
  import Alimentos from './pages/Alimentos.svelte';
  import Consumo from './pages/Consumo.svelte';

  let paginaAtiva = 'alimentos';

  const paginas = [
    { id: 'alimentos', label: 'Alimentos', icon: '🍎' },
    { id: 'consumo', label: 'Consumo', icon: '🍽️' }
  ];
</script>

<div class="app-container">
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Na Medida</h2>
    </div>
    <nav class="sidebar-nav">
      {#each paginas as pagina}
        <button
          class:active={paginaAtiva === pagina.id}
          class="nav-btn"
          data-page={pagina.id}
          onclick={() => (paginaAtiva = pagina.id)}
        >
          <span class="icon">{pagina.icon}</span> {pagina.label}
        </button>
      {/each}
    </nav>
  </aside>

  <main class="main-content">
    {#if paginaAtiva === 'alimentos'}
      <Alimentos />
    {:else}
      <Consumo />
    {/if}
  </main>
</div>