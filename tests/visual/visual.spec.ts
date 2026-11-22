import { test, expect } from '../../fixtures/test';

// Visual regression against an approved baseline: the same idea as checking every
// page against the Figma design. Product images are masked so only layout,
// typography and components are compared.

test.describe('Visual regression @visual', () => {
  test('login page matches baseline', async ({ loginPage, page }) => {
    await loginPage.open();
    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  test('inventory page matches baseline', async ({ loggedIn, page }) => {
    await expect(page).toHaveScreenshot('inventory.png', {
      fullPage: true,
      mask: [page.locator('img.inventory_item_img')],
    });
  });

  test('checkout overview matches baseline', async ({ loggedIn, checkoutPage, page }) => {
    await loggedIn.addToCart('sauce-labs-backpack');
    await loggedIn.openCart();
    await checkoutPage.checkoutButton.click();
    await checkoutPage.fillCustomer('Fauzan', 'QA', '12345');
    await expect(page).toHaveScreenshot('checkout-overview.png', { fullPage: true });
  });
});
