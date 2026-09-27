const { test, expect } = require('@playwright/test');

test('inicia em Consumo e navega para Alimentos', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/consumo$/);
  await expect(page.locator('#consumo h1')).toHaveText('Consumo');
  await expect(page.locator('#consumo')).toContainText('Aqui você pode gerenciar e planejar seu consumo.');
  await expect(page.getByRole('button', { name: /Cadastrar consumo/i })).toBeVisible();

  await page.getByRole('button', { name: /Alimentos/ }).click();

  await expect(page).toHaveURL(/\/alimentos$/);
  await expect(page.locator('#alimentos h1')).toHaveText('Alimentos');
  await expect(page.locator('#alimentos')).toContainText('Aqui você pode gerenciar a base de dados de alimentos.');
  await expect(page.getByRole('button', { name: /Cadastrar alimento/i })).toBeVisible();
});

test('abre rotas diretamente e acompanha voltar e avançar', async ({ page }) => {
  for (const [rota, seletor, titulo] of [
    ['/consumo', '#consumo', 'Consumo'],
    ['/alimentos', '#alimentos', 'Alimentos'],
    ['/peso', '#peso', 'Histórico de peso'],
    ['/arquivo', '#arquivo', 'Arquivo']
  ]) {
    await page.goto(rota);
    await expect(page.locator(`${seletor} h1`)).toHaveText(titulo);
  }

  await page.goto('/peso');
  await expect(page.locator('#peso h1')).toHaveText('Histórico de peso');

  await page.getByRole('button', { name: /Arquivo/ }).click();
  await expect(page).toHaveURL(/\/arquivo$/);
  await expect(page.locator('#arquivo h1')).toHaveText('Arquivo');

  await page.goBack();
  await expect(page).toHaveURL(/\/peso$/);
  await expect(page.locator('#peso h1')).toHaveText('Histórico de peso');

  await page.goForward();
  await expect(page).toHaveURL(/\/arquivo$/);
  await expect(page.locator('#arquivo h1')).toHaveText('Arquivo');
});
