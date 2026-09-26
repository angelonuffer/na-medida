<script>
  import { onDestroy, onMount } from 'svelte';
  import { adicionarConsumo, listarAlimentos } from '../db.js';

  let { onSalvar, onVoltar } = $props();
  let alimentos = $state([]);
  let dataHora = $state(formatarDataHoraLocal(new Date()));
  let imagem = $state(null);
  let imagemPreview = $state('');
  let cameraInput;
  let alimentoId = $state('');
  let alimentoBusca = $state('');
  let sugestoesAbertas = $state(false);
  let sugestaoAtiva = $state(-1);
  let massa = $state('');
  let erro = $state('');
  let alimentosFiltrados = $derived(
    alimentos.filter((alimento) => alimento.nome.toLocaleLowerCase('pt-BR').includes(alimentoBusca.trim().toLocaleLowerCase('pt-BR')))
  );

  onMount(async () => {
    alimentos = await listarAlimentos();
  });

  function formatarDataHoraLocal(data) {
    const deslocamento = data.getTimezoneOffset() * 60_000;
    return new Date(data.getTime() - deslocamento).toISOString().slice(0, 16);
  }

  function selecionarImagem(event) {
    if (imagemPreview) URL.revokeObjectURL(imagemPreview);
    imagem = event.currentTarget.files?.[0] ?? null;
    imagemPreview = imagem?.type.startsWith('image/') ? URL.createObjectURL(imagem) : '';
  }

  function atualizarBuscaAlimento(event) {
    alimentoBusca = event.currentTarget.value;
    alimentoId = '';
    sugestoesAbertas = true;
    sugestaoAtiva = -1;
    erro = '';
  }

  function selecionarAlimento(alimento) {
    alimentoBusca = alimento.nome;
    alimentoId = String(alimento.id);
    sugestoesAbertas = false;
    sugestaoAtiva = -1;
    erro = '';
  }

  function navegarSugestoes(event) {
    if (event.key === 'Escape') {
      sugestoesAbertas = false;
      return;
    }

    if (!sugestoesAbertas || alimentosFiltrados.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      sugestaoAtiva = (sugestaoAtiva + 1) % alimentosFiltrados.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      sugestaoAtiva = (sugestaoAtiva - 1 + alimentosFiltrados.length) % alimentosFiltrados.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selecionarAlimento(alimentosFiltrados[sugestaoAtiva >= 0 ? sugestaoAtiva : 0]);
    }
  }

  onDestroy(() => {
    if (imagemPreview) URL.revokeObjectURL(imagemPreview);
  });

  async function salvarConsumo(event) {
    event.preventDefault();
    const alimento = alimentos.find((item) => String(item.id) === alimentoId);
    if (!alimento) {
      erro = 'Selecione um alimento cadastrado.';
      return;
    }

    await adicionarConsumo({
      dataHora,
      imagem,
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
      <label for="imagem-consumo">Imagem</label>
      <input id="imagem-consumo" type="file" accept="image/*" onchange={selecionarImagem} />
      <input
        bind:this={cameraInput}
        class="input-camera"
        type="file"
        accept="image/*"
        capture="environment"
        onchange={selecionarImagem}
        aria-hidden="true"
        tabindex="-1"
      />
      <button type="button" class="btn-camera" onclick={() => cameraInput?.click()}>
        Tirar foto
      </button>
      {#if imagemPreview}
        <img class="foto-preview" src={imagemPreview} alt="Prévia da imagem selecionada" />
      {/if}
    </div>

    <div class="form-row">
      <label for="alimento-consumo">Alimento</label>
      <input
        id="alimento-consumo"
        type="text"
        value={alimentoBusca}
        placeholder="Digite para buscar alimento"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="sugestoes-alimentos"
        aria-expanded={sugestoesAbertas && alimentosFiltrados.length > 0}
        aria-activedescendant={sugestaoAtiva >= 0 ? `sugestao-alimento-${alimentosFiltrados[sugestaoAtiva]?.id}` : undefined}
        oninput={atualizarBuscaAlimento}
        onkeydown={navegarSugestoes}
        onfocus={() => { if (!alimentoId) sugestoesAbertas = true; }}
        required
      />
      {#if sugestoesAbertas && !alimentoId && alimentosFiltrados.length > 0}
        <ul id="sugestoes-alimentos" class="sugestoes-alimentos" role="listbox">
          {#each alimentosFiltrados as alimento, indice (alimento.id)}
            <li
              id={`sugestao-alimento-${alimento.id}`}
              role="option"
              tabindex="-1"
              aria-selected={indice === sugestaoAtiva}
              onmouseenter={() => { sugestaoAtiva = indice; }}
              onmousedown={(event) => event.preventDefault()}
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  selecionarAlimento(alimento);
                }
              }}
              onclick={() => selecionarAlimento(alimento)}
            >
              {alimento.nome}
            </li>
          {/each}
        </ul>
      {/if}
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