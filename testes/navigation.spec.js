const { test, expect } = require('@playwright/test');

test.describe('Navegação principal', () => {
  test('inicia em Alimentos e navega para Consumo', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveScreenshot('alimentos.png', { fullPage: true });

    await page.getByRole('button', { name: /Consumo/ }).click();

    await expect(page).toHaveScreenshot('consumo.png', { fullPage: true });
  });

  test('mantém o layout responsivo em dispositivos móveis', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page).toHaveScreenshot('alimentos-mobile.png', { fullPage: true });

    await page.getByRole('button', { name: /Consumo/ }).click();

    await expect(page).toHaveScreenshot('consumo-mobile.png', { fullPage: true });
  });

  test('navega para a página de cadastro de alimento', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Cadastrar alimento/ }).click();

    await expect(page).toHaveScreenshot('cadastro-alimento.png', { fullPage: true });

    await page.getByLabel('Nome').fill('Arroz branco cozido');
    await page.getByLabel('Descrição').fill('Arroz cozido em água');
    await page.getByLabel('Valor energético (kcal)').fill('130');
    await page.getByLabel('Carboidratos (g)').fill('28');
    await page.getByRole('button', { name: 'Salvar alimento' }).click();

    await page.getByRole('button', { name: /Alimentos/ }).click();

    await expect(page).toHaveScreenshot('alimentos-com-cadastro.png', { fullPage: true });
  });
});