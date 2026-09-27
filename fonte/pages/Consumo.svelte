<script>
  import { onMount } from 'svelte';
  import { listarAlimentos, listarConsumos } from '../db.js';

  let { onCadastrar } = $props();
  let consumos = $state([]);
  let alimentos = $state([]);
  let diaSelecionado = $state(formatarDataLocal(new Date()));

  const nutrientes = [
    { chave: 'valorEnergetico', nome: 'Valor energético', unidade: 'kcal' },
    { chave: 'gorduras', nome: 'Gorduras', unidade: 'g' },
    { chave: 'carboidratos', nome: 'Carboidratos', unidade: 'g' },
    { chave: 'proteinas', nome: 'Proteínas', unidade: 'g' },
    { chave: 'fibras', nome: 'Fibras', unidade: 'g' },
    { chave: 'massa', nome: 'Massa', unidade: 'g' }
  ];

  let resumo = $derived(calcularResumo(consumos, alimentos, diaSelecionado));
  let consumosDoDia = $derived(consumos.filter((consumo) => consumo.dataHora.slice(0, 10) === diaSelecionado));

  onMount(async () => {
    const [consumosCarregados, alimentosAtivos, alimentosArquivados] = await Promise.all([
      listarConsumos(),
      listarAlimentos(),
      listarAlimentos({ arquivados: true })
    ]);
    consumos = consumosCarregados;
    alimentos = [...alimentosAtivos, ...alimentosArquivados];
  });

  function formatarDataLocal(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function alterarDia(quantidade) {
    const [ano, mes, dia] = (diaSelecionado || formatarDataLocal(new Date())).split('-').map(Number);
    const novaData = new Date(ano, mes - 1, dia);
    novaData.setDate(novaData.getDate() + quantidade);
    diaSelecionado = formatarDataLocal(novaData);
  }

  function calcularResumo(registros, catalogo, dataSelecionada) {
    if (!dataSelecionada) {
      return nutrientes.map((nutriente) => ({ ...nutriente, dia: 0, media: 0 }));
    }

    const [ano, mes, dia] = dataSelecionada.split('-').map(Number);
    const diaSelecionado = new Date(ano, mes - 1, dia);
    const diaChave = formatarDataLocal(diaSelecionado);
    const inicioSemana = new Date(diaSelecionado);
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    const inicioChave = formatarDataLocal(inicioSemana);
    const totaisDia = Object.fromEntries(nutrientes.map(({ chave }) => [chave, 0]));
    const totaisSemana = Object.fromEntries(nutrientes.map(({ chave }) => [chave, 0]));
    const diasComRegistro = new Set();
    const alimentosPorId = new Map(catalogo.map((alimento) => [String(alimento.id), alimento]));

    for (const consumo of registros) {
      const dataConsumo = consumo.dataHora.slice(0, 10);
      const ehDiaSelecionado = dataConsumo === diaChave;
      if (!ehDiaSelecionado && (dataConsumo < inicioChave || dataConsumo >= diaChave)) continue;
      if (!ehDiaSelecionado) diasComRegistro.add(dataConsumo);

      const alimento = alimentosPorId.get(String(consumo.alimentoId));
      if (!alimento) continue;

      const fatorMassa = (Number(consumo.massa) || 0) / 100;
      const totais = ehDiaSelecionado ? totaisDia : totaisSemana;
      for (const { chave } of nutrientes) {
        totais[chave] += chave === 'massa'
          ? Number(consumo.massa) || 0
          : (Number(alimento.tabelaNutricional?.[chave]) || 0) * fatorMassa;
      }
    }

    return nutrientes.map((nutriente) => ({
      ...nutriente,
      dia: totaisDia[nutriente.chave],
      media: diasComRegistro.size ? totaisSemana[nutriente.chave] / diasComRegistro.size : 0
    }));
  }

  function formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor);
  }

  function formatarDataHora(dataHora) {
    const [data, hora] = dataHora.split('T');
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano} às ${hora}`;
  }
</script>

<section id="consumo" class="page-section active">
  <h1>Consumo</h1>
  <p>Aqui você pode gerenciar e planejar seu consumo.</p>
  <div class="seletor-dia">
    <label for="dia-consumo">Dia</label>
    <div class="navegacao-dia">
      <button type="button" aria-label="Dia anterior" title="Dia anterior" onclick={() => alterarDia(-1)}>
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <input id="dia-consumo" type="date" bind:value={diaSelecionado} />
      <button type="button" aria-label="Próximo dia" title="Próximo dia" onclick={() => alterarDia(1)}>
        <span class="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  </div>
  <div class="resumo-nutricional" aria-label="Resumo nutricional">
    {#each resumo as item (item.chave)}
      <article class="resumo-nutricional-item">
        <h2>{item.nome} ({item.unidade})</h2>
        <div class="resumo-nutricional-valores">
          <p>
            <span class="material-symbols-outlined" role="img" aria-label="Valor do dia selecionado" title="Valor do dia selecionado">today</span>
            <strong>{formatarValor(item.dia)}</strong>
          </p>
          <p>
            <span class="material-symbols-outlined" role="img" aria-label="Média dos 7 dias anteriores" title="Média dos 7 dias anteriores">calendar_view_week</span>
            <strong>{formatarValor(item.media)}</strong>
          </p>
        </div>
      </article>
    {/each}
  </div>
  <button class="btn-cadastrar" aria-label="Cadastrar consumo" onclick={onCadastrar}>
    <span class="material-symbols-outlined">add</span>
    <span>Consumo</span>
  </button>
  {#if consumosDoDia.length === 0}
    <div class="content-placeholder"></div>
  {:else}
    <div class="lista-consumos">
      {#each consumosDoDia as consumo (consumo.id)}
        <article class="card-consumo">
          <div>
            <h2>{consumo.alimentoNome}</h2>
          </div>
          <strong>{consumo.dataHora.split("T")[1]}</strong>
        </article>
      {/each}
    </div>
  {/if}
</section>