<script>
  import Alimentos from './pages/Alimentos.svelte';
  import CadastroAlimento from './pages/CadastroAlimento.svelte';
  import Consumo from './pages/Consumo.svelte';
  import DetalheAlimento from './pages/DetalheAlimento.svelte';
  import Arquivo from './pages/Arquivo.svelte';
  import { arquivarAlimento, restaurarAlimento } from './db.js';

  let paginaAtiva = 'alimentos';
  let alimentoSelecionado = null;
  let paginaAnteriorDetalhe = 'alimentos';
  let menuAberto = false;

  const paginas = [
    { id: 'alimentos', label: 'Alimentos', icon: 'restaurant' },
    { id: 'consumo', label: 'Consumo', icon: 'local_dining' },
    { id: 'arquivo', label: 'Arquivo', icon: 'archive' }
  ];

  function abrirDetalhe(alimento, paginaOrigem = 'alimentos') {
    alimentoSelecionado = alimento;
    paginaAnteriorDetalhe = paginaOrigem;
    paginaAtiva = 'detalhe-alimento';
  }

  function voltarParaAlimentos() {
    alimentoSelecionado = null;
    paginaAtiva = paginaAnteriorDetalhe;
  }

  async function arquivarSelecionado(id) {
    await arquivarAlimento(id);
    alimentoSelecionado = null;
    paginaAtiva = 'arquivo';
  }

  async function restaurarSelecionado(id) {
    await restaurarAlimento(id);
    alimentoSelecionado = null;
    paginaAtiva = 'arquivo';
  }

  function alternarMenu() {
    menuAberto = !menuAberto;
  }

  function fecharMenu() {
    menuAberto = false;
  }

  function selecionarPagina(id) {
    paginaAtiva = id;
    fecharMenu();
  }
</script>

<div class="app-container">
  <header class="mobile-topbar">
    <button
      class="menu-toggle"
      aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
      aria-expanded={menuAberto}
      onclick={alternarMenu}
    >
      <span class="material-symbols-outlined">{menuAberto ? 'close' : 'menu'}</span>
    </button>
    <h2>Na Medida</h2>
  </header>

  {#if menuAberto}
    <button class="sidebar-overlay" aria-label="Fechar menu" onclick={fecharMenu}></button>
  {/if}

  <aside class="sidebar" class:open={menuAberto}>
    <div class="sidebar-header">
      <h2>Na Medida</h2>
    </div>
    <nav class="sidebar-nav">
      {#each paginas as pagina}
        <button
          class:active={paginaAtiva === pagina.id}
          class="nav-btn"
          data-page={pagina.id}
          onclick={() => selecionarPagina(pagina.id)}
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
      <Arquivo onSelecionar={(alimento) => abrirDetalhe(alimento, 'arquivo')} />
    {:else if paginaAtiva === 'detalhe-alimento' && alimentoSelecionado}
      <DetalheAlimento
        alimento={alimentoSelecionado}
        onVoltar={voltarParaAlimentos}
        onArquivar={arquivarSelecionado}
        onRestaurar={restaurarSelecionado}
      />
    {:else}
      <Consumo />
    {/if}
  </main>
</div>