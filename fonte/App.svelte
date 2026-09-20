<script>
  import Alimentos from './pages/Alimentos.svelte';
  import CadastroAlimento from './pages/CadastroAlimento.svelte';
  import Consumo from './pages/Consumo.svelte';

  let paginaAtiva = 'alimentos';

  const paginas = [
    { id: 'alimentos', label: 'Alimentos', icon: 'restaurant' },
    { id: 'consumo', label: 'Consumo', icon: 'local_dining' }
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
          <span class="material-symbols-outlined icon">{pagina.icon}</span>
          <span>{pagina.label}</span>
        </button>
      {/each}
    </nav>
  </aside>

  <main class="main-content">
    {#if paginaAtiva === 'alimentos'}
      <Alimentos onCadastrar={() => (paginaAtiva = 'cadastro-alimento')} />
    {:else if paginaAtiva === 'cadastro-alimento'}
      <CadastroAlimento />
    {:else}
      <Consumo />
    {/if}
  </main>
</div>