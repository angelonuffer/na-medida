const { test, expect } = require('@playwright/test');

test('navega para a página de cadastro de alimento', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Alimentos/ }).click();

  await page.getByRole('button', { name: /Cadastrar alimento/ }).click();

  await expect(page.locator('#cadastro-alimento h1')).toHaveText('Cadastrar alimento');
  await expect(page.locator('#cadastro-alimento')).toContainText('Adicione um alimento à base de dados.');

  await page.getByLabel('Nome').fill('Arroz branco cozido');
  await page.getByLabel('Descrição').fill('Arroz cozido em água');
  await page.getByLabel('Valor energético (kcal)').fill('130');
  await page.getByLabel('Carboidratos (g)').fill('28');
  await page.getByRole('button', { name: 'Salvar alimento' }).click();

  await page.getByRole('button', { name: /Alimentos/ }).click();
  await expect(page.locator('#alimentos')).toContainText('Arroz branco cozido');
  await expect(page.locator('#alimentos')).toContainText('Arroz cozido em água');

  await page.getByText('Arroz branco cozido', { exact: true }).click();

  await expect(page.locator('#detalhe-alimento h1')).toHaveText('Arroz branco cozido');
  await expect(page.locator('#detalhe-alimento')).toContainText('Arroz cozido em água');
  await expect(page.getByRole('button', { name: 'Arquivar' })).toBeVisible();
  await expect(page.locator('#detalhe-alimento')).toContainText('Tabela nutricional');

  await page.getByRole('button', { name: 'Arquivar' }).click();

  await expect(page.locator('#arquivo h1')).toHaveText('Arquivo');
  await expect(page.locator('#arquivo')).toContainText('Arroz branco cozido');

  await page.getByText('Arroz branco cozido', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Restaurar' })).toBeVisible();
  await expect(page.locator('#detalhe-alimento')).toContainText('Arroz cozido em água');

  await page.getByRole('button', { name: 'Restaurar' }).click();
  await expect(page.locator('#arquivo h1')).toHaveText('Arquivo');
  await expect(page.locator('#arquivo')).toContainText('Nenhum alimento arquivado.');

  await page.getByRole('button', { name: /Alimentos/ }).click();
  await expect(page.locator('#alimentos')).toContainText('Arroz branco cozido');
});
