const { test, expect } = require('@playwright/test');

async function prepararBanco(page, alimentos, consumos = []) {
  await page.evaluate(async ({ alimentos, consumos }) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('na-medida');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(['alimentos', 'consumos'], 'readwrite');
    for (const alimento of alimentos) tx.objectStore('alimentos').add(alimento);
    for (const consumo of consumos) tx.objectStore('consumos').add(consumo);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }, { alimentos, consumos });
}

test('exibe a página de Consumo com os elementos básicos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();

  await expect(page.locator('#consumo h1')).toHaveText('Consumo');
  await expect(page.locator('#consumo')).toContainText('Aqui você pode gerenciar e planejar seu consumo.');
  await expect(page.getByRole('button', { name: 'Cadastrar consumo' })).toBeVisible();
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
  await expect(page.locator('.card-consumo')).toContainText('100 g');
  await expect(page.locator('.resumo-nutricional')).toContainText('Valor energético');

  await seletorDia.fill('2026-01-01');
  await page.locator('.content-placeholder').waitFor({ state: 'visible' });
  await expect(page.locator('.content-placeholder')).toBeVisible();

  await seletorDia.fill('2026-01-02');
  await page.locator('.card-consumo').waitFor({ state: 'visible' });
  await expect(page.locator('.card-consumo')).toContainText('Aveia em flocos');
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

test('calcula a média dos dias com registros na tela de consumo', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await prepararBanco(page, [
    {
      id: 1,
      nome: 'Alimento do resumo',
      tabelaNutricional: { valorEnergetico: 100, gorduras: 10, carboidratos: 20, proteinas: 5, fibras: 2 }
    }
  ], [
    { dataHora: '2026-01-02T12:00', alimentoId: 1, alimentoNome: 'Alimento do resumo', massa: 100 },
    { dataHora: '2026-01-01T12:00', alimentoId: 1, alimentoNome: 'Alimento do resumo', massa: 700 },
    { dataHora: '2026-01-01T13:00', alimentoId: 1, alimentoNome: 'Alimento do resumo', massa: 300 },
    { dataHora: '2025-12-29T12:00', alimentoId: 1, alimentoNome: 'Alimento do resumo', massa: 200 }
  ]);
  await page.reload();

  const resumo = page.locator('.resumo-nutricional');
  await expect(resumo).toContainText('Valor energético');
  await expect(resumo).toContainText('Gorduras');
  await expect(resumo).toContainText('Carboidratos');
  await expect(resumo).toContainText('Proteínas');
  await expect(resumo).toContainText('Fibras');
  await expect(
    page.locator('.resumo-nutricional-item')
      .filter({ hasText: 'Valor energético' })
      .locator('strong')
      .nth(1)
  ).toHaveText('600');
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
  await page.getByLabel('Valor energético (kcal)').fill('389');
  await page.getByLabel('Gorduras (g)').fill('7');
  await page.getByLabel('Carboidratos (g)').fill('66');
  await page.getByLabel('Proteínas (g)').fill('17');
  await page.getByLabel('Fibras (g)').fill('11');
  await page.getByLabel('Massa (g)').fill('45');

  await page.getByRole('button', { name: 'Salvar consumo' }).click();

  await expect(page.locator('.card-consumo')).toContainText('Aveia');
  await expect(page.locator('.card-consumo')).toContainText('45 g');
});