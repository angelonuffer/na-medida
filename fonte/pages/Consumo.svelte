<script>
  import { onMount } from 'svelte';
  import { listarAlimentos, listarConsumos } from '../db.js';

  let { onCadastrar } = $props();
  let consumos = $state([]);
  let alimentos = $state([]);

  const nutrientes = [
    { chave: 'valorEnergetico', nome: 'Valor energético', unidade: 'kcal' },
    { chave: 'gorduras', nome: 'Gorduras', unidade: 'g' },
    { chave: 'carboidratos', nome: 'Carboidratos', unidade: 'g' },
    { chave: 'proteinas', nome: 'Proteínas', unidade: 'g' },
    { chave: 'fibras', nome: 'Fibras', unidade: 'g' }
  ];

  let resumo = $derived(calcularResumo(consumos, alimentos));

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

  function calcularResumo(registros, catalogo) {
    const hoje = new Date();
    const hojeChave = formatarDataLocal(hoje);
    const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    const inicioChave = formatarDataLocal(inicioSemana);
    const totaisHoje = Object.fromEntries(nutrientes.map(({ chave }) => [chave, 0]));
    const totaisSemana = Object.fromEntries(nutrientes.map(({ chave }) => [chave, 0]));
    const alimentosPorId = new Map(catalogo.map((alimento) => [String(alimento.id), alimento]));

    for (const consumo of registros) {
      const dataConsumo = consumo.dataHora.slice(0, 10);
      const ehHoje = dataConsumo === hojeChave;
      if (!ehHoje && (dataConsumo < inicioChave || dataConsumo >= hojeChave)) continue;

      const alimento = alimentosPorId.get(String(consumo.alimentoId));
      if (!alimento) continue;

      const fatorMassa = (Number(consumo.massa) || 0) / 100;
      const totais = ehHoje ? totaisHoje : totaisSemana;
      for (const { chave } of nutrientes) {
        totais[chave] += (Number(alimento.tabelaNutricional?.[chave]) || 0) * fatorMassa;
      }
    }

    return nutrientes.map((nutriente) => ({
      ...nutriente,
      hoje: totaisHoje[nutriente.chave],
      media: totaisSemana[nutriente.chave] / 7
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
  <div class="resumo-nutricional" aria-label="Resumo nutricional">
    {#each resumo as item (item.chave)}
      <article class="resumo-nutricional-item">
        <h2>{item.nome} ({item.unidade})</h2>
        <div class="resumo-nutricional-valores">
          <p>
            <span class="material-symbols-outlined" role="img" aria-label="Valor de hoje" title="Valor de hoje">today</span>
            <strong>{formatarValor(item.hoje)}</strong>
          </p>
          <p>
            <span class="material-symbols-outlined" role="img" aria-label="Média dos últimos 7 dias até ontem" title="Média dos últimos 7 dias até ontem">calendar_view_week</span>
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
  {#if consumos.length === 0}
    <div class="content-placeholder"></div>
  {:else}
    <div class="lista-consumos">
      {#each consumos as consumo (consumo.id)}
        <article class="card-consumo">
          <div>
            <h2>{consumo.alimentoNome}</h2>
            <p>{formatarDataHora(consumo.dataHora)}</p>
          </div>
          <strong>{consumo.massa} g</strong>
        </article>
      {/each}
    </div>
  {/if}
</section>