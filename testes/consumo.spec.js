const { test, expect } = require('@playwright/test');

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
  await page.getByRole('button', { name: /Alimentos/ }).click();
  await page.getByRole('button', { name: 'Cadastrar alimento' }).click();
  await page.getByLabel('Nome').fill('Aveia em flocos');
  await page.getByLabel('Valor energético (kcal)').fill('100');
  await page.getByLabel('Gorduras (g)').fill('10');
  await page.getByLabel('Carboidratos (g)').fill('20');
  await page.getByLabel('Proteínas (g)').fill('5');
  await page.getByLabel('Fibras (g)').fill('2');
  await page.getByRole('button', { name: 'Salvar alimento' }).click();

  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();
  await page.getByLabel('Data e hora').fill('2026-01-02T12:34');
  await page.getByLabel('Alimento').fill('Aveia');
  await page.getByRole('option', { name: 'Aveia em flocos' }).click();
  await page.getByLabel('Massa (g)').fill('100');
  await page.getByRole('button', { name: 'Salvar consumo' }).click();

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
  await page.getByRole('button', { name: /Alimentos/ }).click();

  for (const nome of ['Aveia em flocos', 'Arroz branco']) {
    await page.getByRole('button', { name: 'Cadastrar alimento' }).click();
    await page.getByLabel('Nome').fill(nome);
    await page.getByRole('button', { name: 'Salvar alimento' }).click();
    await page.getByRole('button', { name: /Alimentos/ }).click();
  }

  await page.getByRole('button', { name: /Consumo/ }).click();
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

test('exibe o resumo nutricional e os itens de nutrição na tela de consumo', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await page.getByRole('button', { name: /Alimentos/ }).click();
  await page.getByRole('button', { name: 'Cadastrar alimento' }).click();
  await page.getByLabel('Nome').fill('Alimento do resumo');
  await page.getByLabel('Valor energético (kcal)').fill('100');
  await page.getByLabel('Gorduras (g)').fill('10');
  await page.getByLabel('Carboidratos (g)').fill('20');
  await page.getByLabel('Proteínas (g)').fill('5');
  await page.getByLabel('Fibras (g)').fill('2');
  await page.getByRole('button', { name: 'Salvar alimento' }).click();

  await page.getByRole('button', { name: /Consumo/ }).click();
  for (const [dataHora, massa] of [['2026-01-02T12:00', '100'], ['2026-01-01T12:00', '700']]) {
    await page.getByRole('button', { name: 'Cadastrar consumo' }).click();
    await page.getByLabel('Data e hora').fill(dataHora);
    await page.getByLabel('Alimento').fill('Alimento do resumo');
    await page.getByRole('option', { name: 'Alimento do resumo' }).click();
    await page.getByLabel('Massa (g)').fill(massa);
    await page.getByRole('button', { name: 'Salvar consumo' }).click();
  }

  const resumo = page.locator('.resumo-nutricional');
  await expect(resumo).toContainText('Valor energético');
  await expect(resumo).toContainText('Gorduras');
  await expect(resumo).toContainText('Carboidratos');
  await expect(resumo).toContainText('Proteínas');
  await expect(resumo).toContainText('Fibras');
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