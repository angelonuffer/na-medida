const { test, expect } = require('@playwright/test');

async function prepararBanco(page, alimentos, consumos = [], medidas = []) {
  await page.evaluate(async ({ alimentos, consumos, medidas }) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('na-medida');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(['alimentos', 'consumos', 'medidas'], 'readwrite');
    for (const alimento of alimentos) tx.objectStore('alimentos').add(alimento);
    for (const consumo of consumos) tx.objectStore('consumos').add(consumo);
    for (const medida of medidas) tx.objectStore('medidas').add(medida);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }, { alimentos, consumos, medidas });
}

test('exibe a página de Consumo com os elementos básicos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();

  await expect(page.locator('#consumo h1')).toHaveText('Consumo');
  await expect(page.locator('#consumo')).toContainText('Aqui você pode gerenciar e planejar seu consumo.');
  await expect(page.getByRole('button', { name: 'Cadastrar consumo' })).toBeVisible();
});

test('mantém nome e valor na mesma linha e a barra em largura total no mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const item = page.locator('.resumo-nutricional-item').filter({ hasText: 'Valor energético' });
  const nome = item.locator('h2');
  const valor = item.locator('strong');
  const barra = item.locator('.barra-recomendacao');
  await expect(barra).toBeVisible();
  const nomeRect = await nome.boundingBox();
  const valorRect = await valor.boundingBox();
  const barraRect = await barra.boundingBox();
  const itemRect = await item.boundingBox();

  expect(Math.abs(nomeRect.y - valorRect.y)).toBeLessThan(4);
  expect(valorRect.x).toBeGreaterThan(nomeRect.x + nomeRect.width);
  expect(barraRect.y).toBeGreaterThan(nomeRect.y + nomeRect.height);
  expect(barraRect.width).toBeGreaterThan(itemRect.width * 0.9);
});

test('filtra os consumos e o resumo pelo dia selecionado', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await prepararBanco(page, [
    {
      id: 1,
      nome: 'Aveia em flocos',
      tabelaNutricional: { valorEnergetico: 100, gorduras: 10, carboidratos: 20, proteinas: 5, fibras: 2 }
    }
  ], [
    { dataHora: '2026-01-02T12:34', alimentoId: 1, alimentoNome: 'Aveia em flocos', massa: 100 }
  ]);
  await page.reload();

  const seletorDia = page.locator('#dia-consumo');
  await expect(page.locator('.card-consumo')).toContainText('Aveia em flocos');
  await expect(page.locator('.resumo-nutricional')).toContainText('Valor energético');
  await expect(
    page.locator('.resumo-nutricional-item')
      .filter({ hasText: 'Massa (g)' })
      .locator('strong')
      .first()
  ).toHaveText('100');

  await seletorDia.fill('2026-01-01');
  await page.locator('.content-placeholder').waitFor({ state: 'visible' });
  await expect(page.locator('.content-placeholder')).toBeVisible();

  await seletorDia.fill('2026-01-02');
  await page.locator('.card-consumo').waitFor({ state: 'visible' });
  await expect(page.locator('.card-consumo')).toContainText('Aveia em flocos');
});

test('usa a medida do dia ou a mais recente anterior e limita a barra a 110% do máximo', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await prepararBanco(page, [
    { id: 1, nome: 'Alimento', tabelaNutricional: { valorEnergetico: 2500 } }
  ], [
    { id: 1, dataHora: '2026-01-02T12:00', alimentoId: 1, alimentoNome: 'Alimento', massa: 100 }
  ], [
    { id: 1, data: '2026-01-01', peso: 80, alturaCm: 170 },
    { id: 2, data: '2026-01-02', peso: 60, alturaCm: 170 },
    { id: 3, data: '2026-01-03', peso: 100, alturaCm: 170 }
  ]);
  await page.reload();

  const faixaEnergia = page.locator('.resumo-nutricional-item').filter({ hasText: 'Valor energético' });
  await expect(page.locator('.origem-faixa-recomendada')).toContainText('02/01/2026');
  await expect(faixaEnergia).toContainText('Mín. 1.500 kcal');
  await expect(faixaEnergia).toContainText('Máx. 1.920 kcal');
  await expect(faixaEnergia.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '2112');
  await expect(faixaEnergia.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2112');
  await expect(faixaEnergia.locator('.barra-recomendacao-preenchida')).toHaveAttribute('style', 'width: 100%;');

  await page.locator('#dia-consumo').fill('2026-01-04');
  await expect(page.locator('.origem-faixa-recomendada')).toContainText('03/01/2026');
  await expect(faixaEnergia).toContainText('Mín. 2.300 kcal');
  await expect(faixaEnergia).toContainText('Máx. 3.000 kcal');
});

test('usa a faixa média recomendada de referência quando não há medidas', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');

  const faixaEnergia = page.locator('.resumo-nutricional-item').filter({ hasText: 'Valor energético' });
  await expect(page.locator('.origem-faixa-recomendada')).toContainText('Faixa média recomendada');
  await expect(faixaEnergia).toContainText('Mín. 1.750 kcal');
  await expect(faixaEnergia).toContainText('Máx. 2.240 kcal');
  await expect(faixaEnergia.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '2464');
});

test('calcula a média das faixas quando todas as medidas são posteriores ao dia selecionado', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await prepararBanco(page, [], [], [
    { id: 1, data: '2026-01-03', peso: 60, alturaCm: 170 },
    { id: 2, data: '2026-01-04', peso: 80, alturaCm: 170 }
  ]);
  await page.reload();

  const faixaEnergia = page.locator('.resumo-nutricional-item').filter({ hasText: 'Valor energético' });
  await expect(page.locator('.origem-faixa-recomendada')).toContainText('Faixa média recomendada');
  await expect(faixaEnergia).toContainText('Mín. 1.830 kcal');
  await expect(faixaEnergia).toContainText('Máx. 2.320 kcal');
  await expect(faixaEnergia.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '2552');
});

test('avança e retrocede um dia pelo seletor de consumo', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-31T12:00:00') });
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();

  const seletorDia = page.locator('#dia-consumo');
  await expect(seletorDia).toHaveValue('2026-01-31');

  await page.getByRole('button', { name: 'Próximo dia' }).click();
  await expect(seletorDia).toHaveValue('2026-02-01');

  await page.getByRole('button', { name: 'Dia anterior' }).click();
  await expect(seletorDia).toHaveValue('2026-01-31');
});

test('exibe o formulário de cadastro de Consumo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();

  await expect(page.locator('#cadastro-consumo h1')).toHaveText('Cadastrar consumo');
  await expect(page.locator('#cadastro-consumo')).toContainText('Informe os dados do alimento consumido.');
  await expect(page.getByLabel('Data e hora')).toBeVisible();
  await expect(page.getByLabel('Imagem')).toBeVisible();
  await expect(page.getByLabel('Alimento')).toBeVisible();
  await expect(page.getByLabel('Massa (g)')).toBeVisible();
});

test('exibe sugestões filtradas de alimentos ao digitar no campo de busca', async ({ page }) => {
  await page.goto('/');
  await prepararBanco(page, [
    { id: 1, nome: 'Aveia em flocos', tabelaNutricional: {} },
    { id: 2, nome: 'Arroz branco', tabelaNutricional: {} }
  ]);
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();
  await page.getByLabel('Alimento').fill('Aveia');

  const sugestoes = page.locator('#sugestoes-alimentos');
  await expect(sugestoes).toContainText('Aveia em flocos');
  await expect(sugestoes).toContainText('Cadastrar "Aveia"');
});

test('seleciona um alimento da TACO e calcula o resumo sem cadastrá-lo no catálogo pessoal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();
  await page.getByLabel('Alimento').fill('Arroz integral cozido');
  await page.getByRole('option', { name: 'TACO/Arroz integral cozido' }).click();
  await page.getByLabel('Massa (g)').fill('45');
  await page.getByRole('button', { name: 'Salvar consumo' }).click();

  const energia = page.locator('.resumo-nutricional-item').filter({ hasText: 'Valor energético' }).locator('strong');
  await expect(energia).toHaveText('55,8');

  const quantidadeAlimentosPessoais = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('na-medida');
    request.onsuccess = () => {
      const transaction = request.result.transaction('alimentos', 'readonly');
      const alimentos = transaction.objectStore('alimentos').count();
      alimentos.onsuccess = () => resolve(alimentos.result);
      alimentos.onerror = () => reject(alimentos.error);
    };
    request.onerror = () => reject(request.error);
  }));
  expect(quantidadeAlimentosPessoais).toBe(0);
});

test('exibe uma miniatura ao selecionar imagem para o consumo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();

  await page.getByLabel('Imagem').setInputFiles({
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pQAAAABJRU5ErkJggg==', 'base64')
  });

  await expect(page.locator('img.foto-preview')).toBeVisible();
});

test('ativa o botão de reconhecimento de alimento somente após carregar a imagem', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();

  const botaoIa = page.getByRole('button', { name: /reconhecer alimento|ia/i });
  await expect(botaoIa).toBeDisabled();

  await page.getByLabel('Imagem').setInputFiles({
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pQAAAABJRU5ErkJggg==', 'base64')
  });

  await expect(botaoIa).toBeEnabled();
});

test('oferece captura de foto pela câmera no cadastro de consumo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();

  await expect(page.getByRole('button', { name: 'Tirar foto' })).toBeVisible();

  const cameraInput = page.locator('.input-camera');
  await cameraInput.setInputFiles({
    name: 'foto-camera.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pQAAAABJRU5ErkJggg==', 'base64')
  });

  await expect(page.locator('img.foto-preview')).toBeVisible();
});

test('exibe um consumo após o cadastro e persiste a imagem no IndexedDB', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Alimentos/ }).click();
  await page.getByRole('button', { name: 'Cadastrar alimento' }).click();
  await page.getByLabel('Nome').fill('Aveia em flocos');
  await page.getByRole('button', { name: 'Salvar alimento' }).click();

  await page.getByRole('button', { name: /Alimentos/ }).click();
  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();
  await page.getByLabel('Data e hora').fill('2026-01-02T12:34');
  await page.getByLabel('Imagem').setInputFiles({
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: Buffer.from('imagem-de-teste')
  });
  await page.getByLabel('Alimento').fill('Aveia');
  await page.getByRole('option', { name: 'Aveia em flocos' }).click();
  await page.getByLabel('Massa (g)').fill('45');
  await page.getByRole('button', { name: 'Salvar consumo' }).click();

  await expect(page.locator('#consumo h1')).toHaveText('Consumo');

  const imagemSalva = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('na-medida');
    request.onsuccess = () => {
      const transaction = request.result.transaction('consumos', 'readonly');
      const consumos = transaction.objectStore('consumos').getAll();
      consumos.onsuccess = () => {
        const imagem = consumos.result[0]?.imagem;
        resolve(imagem ? { nome: imagem.name, tipo: imagem.type } : null);
      };
      consumos.onerror = () => reject(consumos.error);
    };
    request.onerror = () => reject(request.error);
  }));
  expect(imagemSalva).toEqual({ nome: 'foto.png', tipo: 'image/png' });
});

test('alterna o resumo e os registros entre dia e semana', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await prepararBanco(page, [
    {
      id: 1,
      nome: 'Alimento do resumo',
      tabelaNutricional: { valorEnergetico: 100, gorduras: 10, carboidratos: 20, proteinas: 5, fibras: 2 }
    }
  ], [
    { dataHora: '2026-01-02T12:00', alimentoId: 1, alimentoNome: 'Consumo do dia', massa: 100 },
    { dataHora: '2026-01-01T12:00', alimentoId: 1, alimentoNome: 'Consumo da semana', massa: 700 },
    { dataHora: '2026-01-01T13:00', alimentoId: 1, alimentoNome: 'Consumo da semana', massa: 300 },
    { dataHora: '2025-12-29T12:00', alimentoId: 1, alimentoNome: 'Consumo da semana', massa: 200 },
    { dataHora: '2025-12-26T12:00', alimentoId: 1, alimentoNome: 'Consumo da semana', massa: 400 },
    { dataHora: '2025-12-25T12:00', alimentoId: 1, alimentoNome: 'Fora da semana', massa: 900 }
  ]);
  await page.reload();

  const resumo = page.locator('.resumo-nutricional');
  await expect(resumo).toContainText('Valor energético');
  await expect(resumo).toContainText('Gorduras');
  await expect(resumo).toContainText('Carboidratos');
  await expect(resumo).toContainText('Proteínas');
  await expect(resumo).toContainText('Fibras');
  await expect(resumo.locator('.resumo-nutricional-item').last()).toContainText('Massa (g)');
  await expect(
    resumo.locator('.resumo-nutricional-item')
      .filter({ hasText: 'Massa (g)' })
      .locator('strong')
      .first()
  ).toHaveText('100');
  await expect(resumo.locator('.resumo-nutricional-item').first().locator('strong')).toHaveCount(1);
  await page.getByRole('button', { name: 'Exibir semana' }).click();
  await expect(
    resumo.locator('.resumo-nutricional-item')
      .filter({ hasText: 'Massa (g)' })
      .locator('strong')
  ).toHaveText(['533,3']);
  await expect(page.locator('.card-consumo')).toHaveCount(4);
  await expect(page.locator('.lista-consumos')).toContainText('Consumo da semana');
  await expect(page.locator('.lista-consumos')).not.toContainText('Consumo do dia');
  await expect(page.locator('.lista-consumos')).not.toContainText('Fora da semana');
});

test('agrupa e ordena consumos pelo nutriente selecionado', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await prepararBanco(page, [
    { id: 1, nome: 'Aveia', tabelaNutricional: { valorEnergetico: 100 } },
    { id: 2, nome: 'Castanhas', tabelaNutricional: { valorEnergetico: 300 } }
  ], [
    { id: 1, dataHora: '2026-01-02T09:00', alimentoId: 1, alimentoNome: 'Aveia', massa: 100 },
    { id: 2, dataHora: '2026-01-02T10:00', alimentoId: 2, alimentoNome: 'Castanhas', massa: 100 },
    { id: 3, dataHora: '2026-01-02T11:00', alimentoId: 1, alimentoNome: 'Aveia', massa: 200 }
  ]);
  await page.reload();

  await page.getByRole('button', { name: 'Agrupar por Valor energético (kcal)' }).click();

  const grupos = page.locator('.grupo-consumo');
  await expect(grupos).toHaveCount(2);
  await expect(grupos.nth(0)).toContainText('Aveia');
  await expect(grupos.nth(0)).toContainText('300 kcal');
  await expect(grupos.nth(0).locator('li')).toHaveCount(2);
  await expect(grupos.nth(1)).toContainText('Castanhas');
  await expect(grupos.nth(1)).toContainText('300 kcal');

  await page.getByRole('button', { name: 'Agrupar por Valor energético (kcal)' }).click();
  await expect(page.locator('.grupo-consumo')).toHaveCount(0);
  await expect(page.locator('.card-consumo')).toHaveCount(3);
});

test('cadastra um alimento novo com tabela nutricional ao salvar o consumo', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await page.getByRole('button', { name: /Alimentos/ }).click();
  await page.getByRole('button', { name: 'Cadastrar alimento' }).click();
  await page.getByLabel('Nome').fill('Aveia em flocos');
  await page.getByRole('button', { name: 'Salvar alimento' }).click();

  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();
  await page.getByLabel('Data e hora').fill('2026-01-02T12:34');
  await page.getByLabel('Alimento').fill('Aveia');
  await page.getByRole('option', { name: 'Cadastrar "Aveia"' }).click();

  await expect(page.locator('#cadastro-consumo')).toContainText('Tabela nutricional (por 100g)');
  await expect(page.getByRole('button', { name: 'Estimar tabela nutricional com IA' })).toBeEnabled();
  await page.getByLabel('Valor energético (kcal)').fill('389');
  await page.getByLabel('Gorduras (g)').fill('7');
  await page.getByLabel('Carboidratos (g)').fill('66');
  await page.getByLabel('Proteínas (g)').fill('17');
  await page.getByLabel('Fibras (g)').fill('11');
  await page.getByLabel('Massa (g)').fill('45');

  await page.getByRole('button', { name: 'Salvar consumo' }).click();

  await expect(page.locator('.card-consumo')).toContainText('Aveia');
  await expect(
    page.locator('.resumo-nutricional-item')
      .filter({ hasText: 'Massa (g)' })
      .locator('strong')
      .first()
  ).toHaveText('45');
});