import { test, expect } from '../../fixtures/test';
import { LOGIN_CASES } from '../../fixtures/users';

test.describe('Login @ui', () => {
  for (const c of LOGIN_CASES) {
    test(c.name, async ({ loginPage, inventoryPage }) => {
      await loginPage.open();
      await loginPage.login(c.user, c.pass);

      if (c.expectError) {
        await expect(loginPage.error).toContainText(c.expectError);
      } else {
        await expect(inventoryPage.title).toHaveText('Products');
      }
    });
  }
});
