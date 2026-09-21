<script>
  import Alimentos from './pages/Alimentos.svelte';
  import CadastroAlimento from './pages/CadastroAlimento.svelte';
  import Consumo from './pages/Consumo.svelte';
  import DetalheAlimento from './pages/DetalheAlimento.svelte';
  import Arquivo from './pages/Arquivo.svelte';
  import { arquivarAlimento } from './db.js';

  let paginaAtiva = 'alimentos';
  let alimentoSelecionado = null;

  const paginas = [
    { id: 'alimentos', label: 'Alimentos', icon: 'restaurant' },
    { id: 'consumo', label: 'Consumo', icon: 'local_dining' },
    { id: 'arquivo', label: 'Arquivo', icon: 'archive' }
  ];

  function abrirDetalhe(alimento) {
    alimentoSelecionado = alimento;
    paginaAtiva = 'detalhe-alimento';
  }

  function voltarParaAlimentos() {
    alimentoSelecionado = null;
    paginaAtiva = 'alimentos';
  }

  async function arquivarSelecionado(id) {
    await arquivarAlimento(id);
    alimentoSelecionado = null;
    paginaAtiva = 'arquivo';
  }
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
      <Alimentos
        onCadastrar={() => (paginaAtiva = 'cadastro-alimento')}
        onSelecionar={abrirDetalhe}
      />
    {:else if paginaAtiva === 'cadastro-alimento'}
      <CadastroAlimento />
    {:else if paginaAtiva === 'arquivo'}
      <Arquivo />
    {:else if paginaAtiva === 'detalhe-alimento' && alimentoSelecionado}
      <DetalheAlimento
        alimento={alimentoSelecionado}
        onVoltar={voltarParaAlimentos}
        onArquivar={arquivarSelecionado}
      />
    {:else}
      <Consumo />
    {/if}
  </main>
</div>