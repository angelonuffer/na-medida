const { test, expect } = require('@playwright/test');

test('registra peso e exibe o histórico em ordem decrescente de data', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-02T12:00:00') });
  await page.goto('/');
  await page.getByRole('button', { name: /Peso/ }).click();

  await expect(page.getByText('Nenhum peso registrado.')).toBeVisible();
  await page.getByRole('button', { name: 'Registrar peso' }).click();
  await expect(page.getByLabel('Data')).toHaveValue('2026-01-02');
  await page.getByLabel('Data').fill('2026-01-04');
  await page.getByLabel('Peso (kg)').fill('72.3');
  await page.getByRole('button', { name: 'Salvar dados' }).click();

  await page.getByRole('button', { name: 'Registrar peso' }).click();
  await page.getByLabel('Data').fill('2026-01-02');
  await page.getByLabel('Peso (kg)').fill('73.1');
  await page.getByRole('button', { name: 'Salvar dados' }).click();

  const registros = page.locator('.card-peso');
  await expect(registros).toHaveCount(2);
  await expect(registros.nth(0)).toContainText('04/01/2026');
  await expect(registros.nth(0)).toContainText('72,3 kg');
  await expect(registros.nth(1)).toContainText('02/01/2026');
  await expect(registros.nth(1)).toContainText('73,1 kg');
});

test('migra os registros da store antiga para pesos', async ({ page }) => {
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
  await page.getByRole('button', { name: /Peso/ }).click();
  await expect(page.locator('.card-peso')).toContainText('31/12/2025');
  await expect(page.locator('.card-peso')).toContainText('80 kg');

  const stores = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('na-medida');
    request.onsuccess = () => {
      const db = request.result;
      resolve(Array.from(db.objectStoreNames));
      db.close();
    };
    request.onerror = () => reject(request.error);
  }));
  expect(stores).toEqual(['alimentos', 'consumos', 'pesos']);
});