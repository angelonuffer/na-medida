const { test, expect } = require('@playwright/test');

test.describe('Navegação principal', () => {
  test('inicia em Alimentos e navega para Refeições', async ({ page }) => {
    await page.goto('/');

    const alimentosButton = page.getByRole('button', { name: /Alimentos/ });
    const refeicoesButton = page.getByRole('button', { name: /Refeições/ });
    const alimentosSection = page.locator('#alimentos');
    const refeicoesSection = page.locator('#refeicoes');

    await expect(alimentosButton).toHaveClass(/active/);
    await expect(alimentosSection).toHaveClass(/active/);
    await expect(refeicoesButton).not.toHaveClass(/active/);
    await expect(refeicoesSection).not.toHaveClass(/active/);

    await refeicoesButton.click();

    await expect(refeicoesButton).toHaveClass(/active/);
    await expect(refeicoesSection).toHaveClass(/active/);
    await expect(alimentosButton).not.toHaveClass(/active/);
    await expect(alimentosSection).not.toHaveClass(/active/);
  });
});