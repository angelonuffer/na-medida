const { test, expect } = require('@playwright/test');

test('registra medidas, calcula IMC e exibe o histórico por data decrescente', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await page.getByRole('button', { name: /Medidas/ }).click();

  await expect(page.getByText('Nenhuma medida registrada.')).toBeVisible();
  await page.getByRole('button', { name: 'Registrar medidas' }).click();
  await expect(page.getByLabel('Data')).toHaveValue('2026-01-02');

  const campoImc = page.getByLabel('IMC');
  await expect(campoImc).toHaveAttribute('readonly');
  await page.getByLabel('Data').fill('2026-01-04');
  await page.getByLabel('Peso (kg)').fill('72.3');
  await page.getByLabel('Altura (cm)').fill('168');
  await expect(campoImc).toHaveValue('25.62');
  await expect(page.getByText('Classificação: Sobrepeso')).toBeVisible();
  await expect(page.locator('.faixa-imc-sobrepeso')).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('heading', { name: 'Faixas diárias recomendadas' })).toBeVisible();
  await expect(page.locator('.lista-recomendacoes')).toContainText('Valor energético');
  await expect(page.locator('.lista-recomendacoes')).toContainText('Mín.');
  await expect(page.locator('.lista-recomendacoes')).toContainText('Máx.');
  await page.getByRole('button', { name: 'Salvar dados' }).click();

  await page.getByRole('button', { name: 'Registrar medidas' }).click();
  await page.getByLabel('Data').fill('2026-01-02');
  await page.getByLabel('Peso (kg)').fill('73.1');
  await page.getByLabel('Altura (cm)').fill('168');
  await page.getByRole('button', { name: 'Salvar dados' }).click();

  const registros = page.locator('.card-medida');
  await expect(registros).toHaveCount(2);
  await expect(registros.nth(0)).toContainText('04/01/2026');
  await expect(registros.nth(0)).toContainText('72,3 kg');
  await expect(registros.nth(0)).toContainText('1,68 m');
  await expect(registros.nth(0)).toContainText('IMC 25,62');
  await expect(registros.nth(1)).toContainText('02/01/2026');
  await expect(registros.nth(1)).toContainText('73,1 kg');
});

test('migra registros da store biometria para medidas', async ({ page }) => {
  await page.addInitScript(() => {
    const request = indexedDB.open('na-medida', 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('alimentos', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('consumos', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('biometria', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('biometria', 'readwrite');
      tx.objectStore('biometria').add({ data: '2025-12-31', peso: 80 });
      tx.oncomplete = () => db.close();
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: /Medidas/ }).click();
  await expect(page.locator('.card-medida')).toContainText('31/12/2025');
  await expect(page.locator('.card-medida')).toContainText('80 kg');

  const stores = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('na-medida');
    request.onsuccess = () => {
      const db = request.result;
      resolve(Array.from(db.objectStoreNames));
      db.close();
    };
    request.onerror = () => reject(request.error);
  }));
  expect(stores).toEqual(['alimentos', 'consumos', 'medidas']);
});

test('migra registros da store pesos para medidas', async ({ page }) => {
  await page.addInitScript(() => {
    const request = indexedDB.open('na-medida', 4);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('alimentos', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('consumos', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('pesos', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('pesos', 'readwrite');
      tx.objectStore('pesos').add({ data: '2026-01-01', peso: 68, alturaCm: 170, imc: 23.53 });
      tx.oncomplete = () => db.close();
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: /Medidas/ }).click();
  await expect(page.locator('.card-medida')).toContainText('01/01/2026');
  await expect(page.locator('.card-medida')).toContainText('68 kg');
  await expect(page.locator('.card-medida')).toContainText('1,7 m');
  await expect(page.locator('.card-medida')).toContainText('IMC 23,53');
});

test('abre a tela de detalhes ao clicar em uma medida', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await page.getByRole('button', { name: /Medidas/ }).click();

  await page.getByRole('button', { name: 'Registrar medidas' }).click();
  await page.getByLabel('Data').fill('2026-01-04');
  await page.getByLabel('Peso (kg)').fill('72.3');
  await page.getByLabel('Altura (cm)').fill('168');
  await page.getByRole('button', { name: 'Salvar dados' }).click();

  await page.locator('.card-medida').click();

  await expect(page.locator('#detalhe-medida h1')).toContainText('04/01/2026');
  await expect(page.locator('#detalhe-medida')).toContainText('72,3 kg');
  await expect(page.locator('#detalhe-medida')).toContainText('1,68 m');
  await expect(page.locator('#detalhe-medida')).toContainText('IMC 25,62');
  await expect(page.getByRole('heading', { name: 'Faixas diárias recomendadas' })).toBeVisible();
  await expect(page.locator('.lista-recomendacoes')).toContainText('Proteínas');
});