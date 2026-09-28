const { test, expect } = require('@playwright/test');

test('mantém o layout responsivo em dispositivos móveis', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const botaoMenu = page.getByRole('button', { name: 'Abrir menu' });
  await expect(botaoMenu).toBeVisible();
  await expect(botaoMenu).toHaveAttribute('aria-expanded', 'false');

  await botaoMenu.click();
  await expect(page.getByRole('button', { name: /Alimentos/ })).toBeVisible();

  const botaoFecharMenu = page.getByRole('banner').getByRole('button', { name: 'Fechar menu' });
  await expect(botaoFecharMenu).toBeVisible();
  await expect(botaoFecharMenu).toHaveAttribute('aria-expanded', 'true');

  await page.getByRole('button', { name: /Alimentos/ }).click();
  await expect(page.locator('#alimentos h1')).toHaveText('Alimentos');
  await expect(page.locator('#alimentos')).toContainText('Aqui você pode gerenciar a base de dados de alimentos.');

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('button', { name: /Consumo/ })).toBeVisible();
  await expect(botaoFecharMenu).toHaveAttribute('aria-expanded', 'true');

  await page.getByRole('button', { name: /Consumo/ }).click();
  await expect(page.locator('#consumo h1')).toHaveText('Consumo');
  await expect(page.locator('#consumo')).toContainText('Aqui você pode gerenciar e planejar seu consumo.');
});

test('detecção automática do tema do sistema alterna entre claro e escuro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
