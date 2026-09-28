<script>
  import { onDestroy, onMount } from 'svelte';
  import { pipeline } from '@huggingface/transformers';
  import { adicionarAlimento, adicionarConsumo, listarAlimentos } from '../db.js';
  import { alimentosTaco } from '../taco.js';
  import { extrairValoresTabelaNutricional, prepararImagemParaOCR } from '../ocrTabela.mjs';

  let { onSalvar, onVoltar } = $props();
  let alimentos = $state([]);
  let dataHora = $state(formatarDataHoraLocal(new Date()));
  let imagem = $state(null);
  let imagemPreview = $state('');
  let cameraInput;
  let cameraTabelaInput = $state(null);
  let alimentoId = $state('');
  let alimentoBusca = $state('');
  let sugestoesAbertas = $state(false);
  let sugestaoAtiva = $state(-1);
  let modoCadastroAlimento = $state(false);
  let classificando = $state(false);
  let aiClassifier = null;
  let estimandoNutricionais = $state(false);
  let etapaEstimativa = $state('');
  let lendoTabela = $state(false);
  let etapaLeitura = $state('');
  let aiNutrientEstimator = null;
  let tabelaNutricional = $state({
    valorEnergetico: '',
    gorduras: '',
    carboidratos: '',
    proteinas: '',
    fibras: ''
  });
  let massa = $state('');
  let erro = $state('');
  let botaoIaDesabilitado = $derived(!imagem || classificando);
  let termoBusca = $derived(alimentoBusca.trim().replace(/^taco\s*\/\s*/i, '').toLocaleLowerCase('pt-BR'));
  let alimentosFiltrados = $derived(
    alimentos.filter((alimento) => alimento.nome.toLocaleLowerCase('pt-BR').includes(termoBusca))
  );
  let alimentosTacoFiltrados = $derived(
    termoBusca
      ? alimentosTaco.filter((alimento) => alimento.nome.toLocaleLowerCase('pt-BR').includes(termoBusca)).slice(0, 10)
      : []
  );
  let mostrarOpcaoCadastro = $derived(
    Boolean(termoBusca)
      && !alimentos.some((alimento) => alimento.nome.trim().toLocaleLowerCase('pt-BR') === termoBusca)
      && !alimentosTaco.some((alimento) => alimento.nome.trim().toLocaleLowerCase('pt-BR') === termoBusca)
  );
  let quantidadeSugestoes = $derived(alimentosFiltrados.length + alimentosTacoFiltrados.length + Number(mostrarOpcaoCadastro));

  onMount(async () => {
    alimentos = await listarAlimentos();
  });

  function formatarDataHoraLocal(data) {
    const deslocamento = data.getTimezoneOffset() * 60_000;
    return new Date(data.getTime() - deslocamento).toISOString().slice(0, 16);
  }

  function limparLabelIo(label = '') {
    if (!label) return '';
    return label
      .split(',')[0]
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatarLabelAlimento(label = '') {
    const texto = limparLabelIo(label);
    if (!texto) return '';
    return texto
      .split(' ')
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
      .join(' ');
  }

  async function carregarClassificadorIa() {
    if (aiClassifier) return aiClassifier;

    const modelos = ['Xenova/food101', 'Xenova/foodnet', 'Xenova/vit-base-patch16-224'];
    let ultimoErro = null;

    for (const modelo of modelos) {
      try {
        aiClassifier = await pipeline('image-classification', modelo);
        return aiClassifier;
      } catch (error) {
        ultimoErro = error;
      }
    }

    throw ultimoErro ?? new Error('Não foi possível carregar o classificador de imagem.');
  }

  async function carregarEstimadorNutricional() {
    if (aiNutrientEstimator) return aiNutrientEstimator;

    aiNutrientEstimator = await pipeline(
      'text-generation',
      'onnx-community/Qwen2.5-0.5B-Instruct',
      { dtype: 'q4' }
    );
    return aiNutrientEstimator;
  }

  function extrairNumeroEstimado(resultado) {
    const resposta = resultado?.[0]?.generated_text;
    const texto = Array.isArray(resposta) ? resposta.at(-1)?.content : resposta;
    const numero = String(texto ?? '').match(/\d+(?:[.,]\d+)?/);
    if (!numero) throw new Error('A IA não retornou um valor numérico válido.');

    const valor = Number(numero[0].replace(',', '.'));
    if (!Number.isFinite(valor)) throw new Error('A IA não retornou um valor numérico válido.');
    return valor;
  }

  async function estimarTabelaNutricional() {
    if (!alimentoBusca.trim() || estimandoNutricionais) return;

    const nutrientes = [
      { chave: 'valorEnergetico', nome: 'valor energético', unidade: 'kcal' },
      { chave: 'gorduras', nome: 'gorduras', unidade: 'g' },
      { chave: 'carboidratos', nome: 'carboidratos', unidade: 'g' },
      { chave: 'proteinas', nome: 'proteínas', unidade: 'g' },
      { chave: 'fibras', nome: 'fibras', unidade: 'g' }
    ];

    estimandoNutricionais = true;
    erro = '';

    try {
      etapaEstimativa = 'Carregando modelo de IA...';
      const estimador = await carregarEstimadorNutricional();

      for (const nutriente of nutrientes) {
        if (String(tabelaNutricional[nutriente.chave]).trim()) continue;

        etapaEstimativa = `Estimando ${nutriente.nome}...`;
        const resultado = await estimador([
          {
            role: 'system',
            content: 'Você estima valores nutricionais de alimentos. Responda apenas com um número não negativo, sem unidade nem explicação.'
          },
          {
            role: 'user',
            content: `Estime ${nutriente.nome} em ${nutriente.unidade} por 100 g para o alimento "${alimentoBusca.trim()}". Responda somente com o número.`
          }
        ], { max_new_tokens: 16, do_sample: false });

        tabelaNutricional[nutriente.chave] = String(extrairNumeroEstimado(resultado));
      }
    } catch (error) {
      erro = error instanceof Error
        ? `Não foi possível estimar a tabela nutricional: ${error.message}`
        : 'Não foi possível estimar a tabela nutricional.';
    } finally {
      estimandoNutricionais = false;
      etapaEstimativa = '';
    }
  }

  async function lerTabelaNutricional(event) {
    const arquivo = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!arquivo || lendoTabela) return;

    let leitor;
    lendoTabela = true;
    etapaLeitura = 'Preparando imagem e carregando OCR...';

    try {
      const { createWorker } = await import('tesseract.js');
      leitor = await createWorker('por+eng', 1, {
        langPath: 'https://tessdata.projectnaptha.com/4.0.0_best'
      });
      await leitor.setParameters({
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
        tessedit_pageseg_mode: '6'
      });

      const imagemContraste = await prepararImagemParaOCR(arquivo);
      const imagemBinarizada = await prepararImagemParaOCR(arquivo, true);
      const leituras = [];
      const configuracoes = [
        { imagem: imagemContraste, modo: '6', descricao: 'bloco de tabela' },
        { imagem: imagemContraste, modo: '4', descricao: 'colunas da tabela' },
        { imagem: imagemContraste, modo: '11', descricao: 'texto esparso' },
        { imagem: imagemBinarizada, modo: '6', descricao: 'alto contraste' }
      ];

      for (const configuracao of configuracoes) {
        etapaLeitura = `Lendo tabela: ${configuracao.descricao} (${leituras.length + 1}/${configuracoes.length})...`;
        await leitor.setParameters({ tessedit_pageseg_mode: configuracao.modo });
        const resultado = await leitor.recognize(configuracao.imagem);
        const valores = extrairValoresTabelaNutricional(resultado.data.text);
        leituras.push({ valores, confianca: resultado.data.confidence ?? 0 });
      }

      const melhorLeitura = leituras.reduce((melhor, leitura) => {
        const pontuacao = Object.keys(leitura.valores).length * 1000 + leitura.confianca;
        const melhorPontuacao = Object.keys(melhor.valores).length * 1000 + melhor.confianca;
        return pontuacao > melhorPontuacao ? leitura : melhor;
      });
      const valores = melhorLeitura.valores;
      const encontrados = Object.keys(valores).length;

      if (!encontrados) {
        etapaLeitura = 'Não consegui confirmar a coluna 100 g nem identificar nutrientes com segurança. Enquadre o cabeçalho e tente outra foto.';
        return;
      }

      tabelaNutricional = { ...tabelaNutricional, ...valores };
      etapaLeitura = `${encontrados} ${encontrados === 1 ? 'valor identificado' : 'valores identificados'} após ${leituras.length} leituras. Confira antes de salvar.`;
    } catch (error) {
      etapaLeitura = error instanceof Error
        ? `Não foi possível ler a foto: ${error.message}`
        : 'Não foi possível ler a foto da tabela nutricional.';
    } finally {
      await leitor?.terminate();
      lendoTabela = false;
    }
  }

  async function identificarAlimentoComIa() {
    if (!imagem) return;

    classificando = true;
    erro = '';

    try {
      const classificador = await carregarClassificadorIa();
      const resultado = await classificador(imagem, { top_k: 3 });
      const labels = Array.isArray(resultado) ? resultado : [resultado];
      const melhorLabel = labels
        .flatMap((item) => Array.isArray(item) ? item : [item])
        .map((item) => item?.label)
        .map(formatarLabelAlimento)
        .find((label) => Boolean(label));

      if (!melhorLabel) {
        throw new Error('Não foi possível reconhecer o alimento na imagem.');
      }

      alimentoBusca = melhorLabel;
      alimentoId = '';
      modoCadastroAlimento = false;
      sugestoesAbertas = true;
      sugestaoAtiva = -1;
    } catch (error) {
      erro = error instanceof Error ? error.message : 'Não foi possível identificar o alimento na imagem.';
    } finally {
      classificando = false;
    }
  }

  function selecionarImagem(event) {
    if (imagemPreview) URL.revokeObjectURL(imagemPreview);
    imagem = event.currentTarget.files?.[0] ?? null;
    imagemPreview = imagem?.type.startsWith('image/') ? URL.createObjectURL(imagem) : '';
    if (imagem) {
      erro = '';
    }
  }

  function atualizarBuscaAlimento(event) {
    alimentoBusca = event.currentTarget.value;
    alimentoId = '';
    modoCadastroAlimento = false;
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

  function iniciarCadastroAlimento() {
    alimentoBusca = alimentoBusca.trim();
    alimentoId = '';
    modoCadastroAlimento = true;
    sugestoesAbertas = false;
    sugestaoAtiva = -1;
    erro = '';
  }

  function navegarSugestoes(event) {
    if (event.key === 'Escape') {
      sugestoesAbertas = false;
      return;
    }

    if (!sugestoesAbertas || quantidadeSugestoes === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      sugestaoAtiva = (sugestaoAtiva + 1) % quantidadeSugestoes;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      sugestaoAtiva = (sugestaoAtiva - 1 + quantidadeSugestoes) % quantidadeSugestoes;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const indice = sugestaoAtiva >= 0 ? sugestaoAtiva : 0;
      if (indice < alimentosFiltrados.length) selecionarAlimento(alimentosFiltrados[indice]);
      else if (indice < alimentosFiltrados.length + alimentosTacoFiltrados.length) {
        selecionarAlimento(alimentosTacoFiltrados[indice - alimentosFiltrados.length]);
      } else iniciarCadastroAlimento();
    }
  }

  onDestroy(() => {
    if (imagemPreview) URL.revokeObjectURL(imagemPreview);
  });

  async function salvarConsumo(event) {
    event.preventDefault();
    let alimento = alimentos.find((item) => String(item.id) === alimentoId)
      ?? alimentosTaco.find((item) => String(item.id) === alimentoId);
    if (modoCadastroAlimento) {
      const alimentoNovo = {
        nome: alimentoBusca.trim(),
        tabelaNutricional: Object.fromEntries(
          Object.entries(tabelaNutricional).map(([chave, valor]) => [chave, Number(valor) || 0])
        )
      };
      const id = await adicionarAlimento(alimentoNovo);
      alimento = { ...alimentoNovo, id };
    }

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
      <div class="campo-com-botao">
        <input
          id="alimento-consumo"
          type="text"
          value={alimentoBusca}
          placeholder="Digite para buscar alimento"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="sugestoes-alimentos"
          aria-expanded={sugestoesAbertas && quantidadeSugestoes > 0}
          aria-activedescendant={sugestaoAtiva < 0
            ? undefined
            : sugestaoAtiva < alimentosFiltrados.length
              ? `sugestao-alimento-${alimentosFiltrados[sugestaoAtiva]?.id}`
              : sugestaoAtiva < alimentosFiltrados.length + alimentosTacoFiltrados.length
                ? `sugestao-taco-${alimentosTacoFiltrados[sugestaoAtiva - alimentosFiltrados.length]?.id}`
                : 'sugestao-cadastro-alimento'}
          oninput={atualizarBuscaAlimento}
          onkeydown={navegarSugestoes}
          onfocus={() => { if (!alimentoId) sugestoesAbertas = true; }}
          required
        />
        <button
          type="button"
          class="btn-ia"
          aria-label={classificando ? 'IA em execução' : 'IA'}
          title="Reconhecer alimento com IA"
          disabled={botaoIaDesabilitado}
          onclick={identificarAlimentoComIa}
        >
          <span class="material-symbols-outlined">{classificando ? 'sync' : 'auto_awesome'}</span>
        </button>
      </div>
      {#if sugestoesAbertas && !alimentoId && quantidadeSugestoes > 0}
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
          {#each alimentosTacoFiltrados as alimento, indice (alimento.id)}
            <li
              id={`sugestao-taco-${alimento.id}`}
              role="option"
              tabindex="-1"
              aria-selected={sugestaoAtiva === alimentosFiltrados.length + indice}
              onmouseenter={() => { sugestaoAtiva = alimentosFiltrados.length + indice; }}
              onmousedown={(event) => event.preventDefault()}
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  selecionarAlimento(alimento);
                }
              }}
              onclick={() => selecionarAlimento(alimento)}
            >
              TACO/{alimento.nome}
            </li>
          {/each}
          {#if mostrarOpcaoCadastro}
            <li
              id="sugestao-cadastro-alimento"
              role="option"
              tabindex="-1"
              aria-selected={sugestaoAtiva === alimentosFiltrados.length + alimentosTacoFiltrados.length}
              onmouseenter={() => { sugestaoAtiva = alimentosFiltrados.length + alimentosTacoFiltrados.length; }}
              onmousedown={(event) => event.preventDefault()}
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  iniciarCadastroAlimento();
                }
              }}
              onclick={iniciarCadastroAlimento}
            >
              Cadastrar "{alimentoBusca.trim()}"
            </li>
          {/if}
        </ul>
      {/if}
      {#if modoCadastroAlimento}
        <fieldset class="tabela-nutricional">
          <legend>Tabela nutricional (por 100g)</legend>
          <button
            type="button"
            class="btn-estimar-nutricao"
            aria-label={estimandoNutricionais ? 'Estimando tabela nutricional' : 'Estimar tabela nutricional com IA'}
            title="Estimar valores nutricionais com IA"
            disabled={estimandoNutricionais || !alimentoBusca.trim()}
            onclick={estimarTabelaNutricional}
          >
            <span class="material-symbols-outlined">{estimandoNutricionais ? 'sync' : 'auto_awesome'}</span>
            Estimar com IA
          </button>
          <input
            bind:this={cameraTabelaInput}
            class="input-camera"
            type="file"
            accept="image/*"
            capture="environment"
            onchange={lerTabelaNutricional}
            aria-hidden="true"
            tabindex="-1"
          />
          <button
            type="button"
            class="btn-camera"
            disabled={lendoTabela}
            onclick={() => cameraTabelaInput?.click()}
          >
            <span class="material-symbols-outlined">{lendoTabela ? 'sync' : 'document_scanner'}</span>
            {lendoTabela ? 'Lendo tabela...' : 'Fotografar tabela'}
          </button>
          {#if etapaLeitura}
            <small aria-live="polite">{etapaLeitura}</small>
          {/if}
          {#if etapaEstimativa}
            <small aria-live="polite">{etapaEstimativa}</small>
          {/if}
          <small>Valores estimados. Confira antes de salvar.</small>
          <div class="form-row">
            <label for="novo-valor-energetico">Valor energético (kcal)</label>
            <input id="novo-valor-energetico" type="number" min="0" step="0.1" bind:value={tabelaNutricional.valorEnergetico} />
          </div>
          <div class="form-row">
            <label for="novo-valor-gorduras">Gorduras (g)</label>
            <input id="novo-valor-gorduras" type="number" min="0" step="0.1" bind:value={tabelaNutricional.gorduras} />
          </div>
          <div class="form-row">
            <label for="novo-valor-carboidratos">Carboidratos (g)</label>
            <input id="novo-valor-carboidratos" type="number" min="0" step="0.1" bind:value={tabelaNutricional.carboidratos} />
          </div>
          <div class="form-row">
            <label for="novo-valor-proteinas">Proteínas (g)</label>
            <input id="novo-valor-proteinas" type="number" min="0" step="0.1" bind:value={tabelaNutricional.proteinas} />
          </div>
          <div class="form-row">
            <label for="novo-valor-fibras">Fibras (g)</label>
            <input id="novo-valor-fibras" type="number" min="0" step="0.1" bind:value={tabelaNutricional.fibras} />
          </div>
        </fieldset>
      {/if}
      {#if alimentos.length === 0}
        <small>Nenhum alimento pessoal cadastrado.</small>
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