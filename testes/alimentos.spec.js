const { test, expect } = require('@playwright/test');

test('navega para a página de cadastro de alimento', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Alimentos/ }).click();

  await page.getByRole('button', { name: /Cadastrar alimento/ }).click();

  await expect(page).toHaveScreenshot('cadastro-alimento.png', { fullPage: true });

  await page.getByLabel('Nome').fill('Arroz branco cozido');
  await page.getByLabel('Descrição').fill('Arroz cozido em água');
  await page.getByLabel('Valor energético (kcal)').fill('130');
  await page.getByLabel('Carboidratos (g)').fill('28');
  await page.getByRole('button', { name: 'Salvar alimento' }).click();

  await page.getByRole('button', { name: /Alimentos/ }).click();

  await expect(page).toHaveScreenshot('alimentos-com-cadastro.png', { fullPage: true });

  await page.getByText('Arroz branco cozido', { exact: true }).click();

  await expect(page).toHaveScreenshot('detalhe-alimento.png', { fullPage: true });

  await page.getByRole('button', { name: 'Arquivar' }).click();

  await expect(page).toHaveScreenshot('arquivo-com-alimento.png', { fullPage: true });

  await page.getByText('Arroz branco cozido', { exact: true }).click();
  await expect(page).toHaveScreenshot('detalhe-alimento-arquivado.png', { fullPage: true });

  await page.getByRole('button', { name: 'Restaurar' }).click();
  await expect(page).toHaveScreenshot('arquivo-apos-restaurar.png', { fullPage: true });

  await page.getByRole('button', { name: /Alimentos/ }).click();
  await expect(page).toHaveScreenshot('alimentos-com-cadastro.png', { fullPage: true });
});
