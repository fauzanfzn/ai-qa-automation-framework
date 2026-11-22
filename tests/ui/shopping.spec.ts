import { test, expect } from '../../fixtures/test';

test.describe('Shopping flow @ui', () => {
  test('catalog shows 6 products', async ({ loggedIn }) => {
    await expect(loggedIn.items).toHaveCount(6);
  });

  test('sort by price low to high is ascending', async ({ loggedIn }) => {
    await loggedIn.sortBy('lohi');
    const prices = await loggedIn.priceValues();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sort by price high to low is descending', async ({ loggedIn }) => {
    await loggedIn.sortBy('hilo');
    const prices = await loggedIn.priceValues();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('cart badge follows add and remove', async ({ loggedIn }) => {
    await loggedIn.addToCart('sauce-labs-backpack');
    await loggedIn.addToCart('sauce-labs-bike-light');
    await expect(loggedIn.cartBadge).toHaveText('2');
    await loggedIn.removeFromCart('sauce-labs-backpack');
    await expect(loggedIn.cartBadge).toHaveText('1');
  });

  test('end-to-end checkout completes and subtotal matches cart', async ({ loggedIn, checkoutPage }) => {
    await loggedIn.addToCart('sauce-labs-backpack'); // $29.99
    await loggedIn.addToCart('sauce-labs-onesie'); // $7.99
    await loggedIn.openCart();
    await expect(checkoutPage.cartItems).toHaveCount(2);

    await checkoutPage.checkoutButton.click();
    await checkoutPage.fillCustomer('Fauzan', 'QA', '12345');
    await expect(checkoutPage.itemTotal).toHaveText('Item total: $37.98');

    await checkoutPage.finishButton.click();
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });

  test('checkout requires customer details', async ({ loggedIn, checkoutPage }) => {
    await loggedIn.addToCart('sauce-labs-backpack');
    await loggedIn.openCart();
    await checkoutPage.checkoutButton.click();
    await checkoutPage.continueButton.click();
    await expect(checkoutPage.error).toContainText('First Name is required');
  });
});
