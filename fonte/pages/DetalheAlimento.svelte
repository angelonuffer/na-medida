<script>
  let { alimento, onVoltar, onArquivar, onRestaurar } = $props();

  function fotoUrl(item) {
    return item.foto ? URL.createObjectURL(item.foto) : '';
  }
</script>

<section id="detalhe-alimento" class="page-section active">
  <button class="btn-voltar" onclick={onVoltar}>
    <span class="material-symbols-outlined">arrow_back</span>
    <span>Voltar para {alimento.arquivado ? 'arquivo' : 'alimentos'}</span>
  </button>

  {#if alimento.arquivado}
    <button class="btn-arquivar btn-restaurar" onclick={() => onRestaurar(alimento.id)}>
      <span class="material-symbols-outlined">unarchive</span>
      <span>Restaurar</span>
    </button>
  {:else}
    <button class="btn-arquivar" onclick={() => onArquivar(alimento.id)}>
      <span class="material-symbols-outlined">archive</span>
      <span>Arquivar</span>
    </button>
  {/if}

  <div class="detalhe-cabecalho">
    {#if alimento.foto}
      <img class="detalhe-foto" src={fotoUrl(alimento)} alt={alimento.nome} />
    {/if}
    <div>
      <h1>{alimento.nome}</h1>
      <p>{alimento.descricao || 'Sem descrição.'}</p>
    </div>
  </div>

  <section class="detalhe-nutricao" aria-labelledby="titulo-nutricao">
    <h2 id="titulo-nutricao">Tabela nutricional</h2>
    <p>Valores por 100g</p>
    <dl>
      <div><dt>Valor energético</dt><dd>{alimento.tabelaNutricional.valorEnergetico} kcal</dd></div>
      <div><dt>Gorduras</dt><dd>{alimento.tabelaNutricional.gorduras} g</dd></div>
      <div><dt>Carboidratos</dt><dd>{alimento.tabelaNutricional.carboidratos} g</dd></div>
      <div><dt>Proteínas</dt><dd>{alimento.tabelaNutricional.proteinas} g</dd></div>
      <div><dt>Fibras</dt><dd>{alimento.tabelaNutricional.fibras} g</dd></div>
    </dl>
  </section>
</section>