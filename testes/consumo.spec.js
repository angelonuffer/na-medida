const { test, expect } = require('@playwright/test');

test('exibe a página de Consumo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();

  await expect(page).toHaveScreenshot('consumo-inicial.png', { fullPage: true });
});

test('exibe o formulário de cadastro de Consumo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();

  await page.getByLabel('Data e hora').fill('2026-01-02T12:34');

  await expect(page).toHaveScreenshot('cadastro-consumo.png', { fullPage: true });
});

test('exibe uma miniatura ao selecionar imagem para o consumo', async ({ page }) => {
  await page.goto('/');
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();
  await page.getByLabel('Imagem').setInputFiles({
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pQAAAABJRU5ErkJggg==', 'base64')
  });

  const miniatura = page.getByRole('img', { name: 'Prévia da imagem selecionada' });
  await expect(page).toHaveScreenshot('cadastro-consumo-com-imagem.png', { fullPage: true });
});

test('exibe visualmente um consumo após o cadastro', async ({ page }) => {
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
  await page.getByLabel('Alimento').selectOption({ label: 'Aveia em flocos' });
  await page.getByLabel('Massa (g)').fill('45');
  await page.getByRole('button', { name: 'Salvar consumo' }).click();

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

  await expect(page).toHaveScreenshot('lista-consumo-apos-cadastro.png', { fullPage: true });
});

test('exibe o resumo nutricional de hoje e a média dos sete dias anteriores', async ({ page }) => {
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
    await page.getByLabel('Alimento').selectOption({ label: 'Alimento do resumo' });
    await page.getByLabel('Massa (g)').fill(massa);
    await page.getByRole('button', { name: 'Salvar consumo' }).click();
  }

  await expect(page).toHaveScreenshot('resumo-nutricional.png', { fullPage: true });
});