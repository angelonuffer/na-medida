<script>
  import { onMount } from 'svelte';
  import Alimentos from './pages/Alimentos.svelte';
  import CadastroAlimento from './pages/CadastroAlimento.svelte';
  import CadastroConsumo from './pages/CadastroConsumo.svelte';
  import Consumo from './pages/Consumo.svelte';
  import DetalheAlimento from './pages/DetalheAlimento.svelte';
  import Arquivo from './pages/Arquivo.svelte';
  import Medidas from './pages/Medidas.svelte';
  import CadastroMedidas from './pages/CadastroMedidas.svelte';
  import { arquivarAlimento, restaurarAlimento } from './db.js';

  let paginaAtiva = 'consumo';
  let alimentoSelecionado = null;
  let paginaAnteriorDetalhe = 'alimentos';
  let menuAberto = false;

  const paginas = [
    { id: 'consumo', label: 'Consumo', icon: 'local_dining' },
    { id: 'alimentos', label: 'Alimentos', icon: 'restaurant' },
    { id: 'medidas', label: 'Medidas', icon: 'straighten' },
    { id: 'arquivo', label: 'Arquivo', icon: 'archive' }
  ];

  function paginaDaUrl() {
    let caminho = window.location.pathname;
    const base = import.meta.env.BASE_URL;

    if (base !== '/' && caminho.startsWith(base)) {
      caminho = `/${caminho.slice(base.length)}`;
    }

    caminho = caminho.replace(/\/+$/, '') || '/';
    return paginas.find((pagina) => caminho === `/${pagina.id}`)?.id
      ?? (caminho === '/peso' ? 'medidas' : null);
  }

  function atualizarUrl(id, substituir = false) {
    const url = `${import.meta.env.BASE_URL}${id}`;
    if (window.location.pathname === url) return;

    if (substituir) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
  }

  onMount(() => {
    const rotaInicial = paginaDaUrl();
    if (rotaInicial) {
      paginaAtiva = rotaInicial;
    } else {
      paginaAtiva = 'consumo';
      atualizarUrl('consumo', true);
    }

    const aoNavegarHistorico = () => {
      paginaAtiva = paginaDaUrl() ?? 'consumo';
      alimentoSelecionado = null;
    };

    window.addEventListener('popstate', aoNavegarHistorico);
    return () => window.removeEventListener('popstate', aoNavegarHistorico);
  });

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
    atualizarUrl(id);
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
          class:active={paginaAtiva === pagina.id || (pagina.id === 'medidas' && paginaAtiva === 'cadastro-medidas')}
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
    {:else if paginaAtiva === 'cadastro-consumo'}
      <CadastroConsumo onSalvar={() => (paginaAtiva = 'consumo')} onVoltar={() => (paginaAtiva = 'consumo')} />
    {:else if paginaAtiva === 'medidas'}
      <Medidas onCadastrar={() => (paginaAtiva = 'cadastro-medidas')} />
    {:else if paginaAtiva === 'cadastro-medidas'}
      <CadastroMedidas
        onSalvar={() => (paginaAtiva = 'medidas')}
        onVoltar={() => (paginaAtiva = 'medidas')}
      />
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
      <Consumo onCadastrar={() => (paginaAtiva = 'cadastro-consumo')} />
    {/if}
  </main>
</div>