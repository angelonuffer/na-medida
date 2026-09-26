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

test('exibe visualmente um consumo após o cadastro', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cadastrar alimento' }).click();
  await page.getByLabel('Nome').fill('Aveia em flocos');
  await page.getByRole('button', { name: 'Salvar alimento' }).click();

  await page.getByRole('button', { name: /Alimentos/ }).click();
  await page.getByRole('button', { name: /Consumo/ }).click();
  await page.getByRole('button', { name: 'Cadastrar consumo' }).click();
  await page.getByLabel('Data e hora').fill('2026-01-02T12:34');
  await page.getByLabel('Alimento').selectOption({ label: 'Aveia em flocos' });
  await page.getByLabel('Massa (g)').fill('45');
  await page.getByRole('button', { name: 'Salvar consumo' }).click();

  await expect(page).toHaveScreenshot('lista-consumo-apos-cadastro.png', { fullPage: true });
});