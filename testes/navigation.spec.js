const { test, expect } = require('@playwright/test');

test.describe('Navegação principal', () => {
  test('inicia em Alimentos e navega para Consumo', async ({ page }) => {
    await page.goto('/');

    const alimentosButton = page.getByRole('button', { name: /Alimentos/ });
    const consumoButton = page.getByRole('button', { name: /Consumo/ });
    const alimentosSection = page.locator('#alimentos');
    const consumoSection = page.locator('#consumo');

    await expect(alimentosButton).toHaveClass(/active/);
    await expect(alimentosSection).toHaveClass(/active/);
    await expect(consumoButton).not.toHaveClass(/active/);
    await expect(consumoSection).not.toHaveClass(/active/);

    await expect(page).toHaveScreenshot('alimentos.png', { fullPage: true });

    await consumoButton.click();

    await expect(consumoButton).toHaveClass(/active/);
    await expect(consumoSection).toHaveClass(/active/);
    await expect(alimentosButton).not.toHaveClass(/active/);
    await expect(alimentosSection).not.toHaveClass(/active/);

    await expect(page).toHaveScreenshot('consumo.png', { fullPage: true });
  });
});