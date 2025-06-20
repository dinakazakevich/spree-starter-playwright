import { test, expect } from '../lib/fixtures/instantiate';
import { successResponse } from '../lib/datafactory/mockCheckoutConfirmation';
import { generateUser } from '../lib/datafactory/testData';
import { faker } from '@faker-js/faker';

const testUser = generateUser();
test.use({ userParams: testUser });
test('checkout flow with mocked payment confirmation', async ({
  homePage,
  productsPage,
  productDetailsPage,
  checkoutPage,
}) => {
  let cartToken = '';
  // Mock the api call for the final step of the checkout flow
  await checkoutPage.page.route('*/**/checkout/**/update/confirm', async (route, request) => {
    if (request.method() === 'POST') {
      const cartURL = checkoutPage.page.url();
      const cartTokenArray = cartURL.split('/');
      cartToken = cartTokenArray[cartTokenArray.length - 2];

      // await authenticatedUserClient.retrieveCart();
      await route.fulfill({
        status: 302,
        contentType: 'text/html',
        body: successResponse,
        headers: {
          location: `/checkout/${cartToken}/complete`,
        },
      });
    } else {
      await route.continue();
    }
  });

  // Mock the api call for the final step of the checkout flow
  await checkoutPage.page.route('*/**/checkout/**/complete', async (route) => {
    const cartURL = checkoutPage.page.url();
    // console.log('cartURL:', cartURL);
    const cartTokenArray = cartURL.split('/');
    cartToken = cartTokenArray[cartTokenArray.length - 2];
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: successResponse,
    });
  });

  await homePage.page.goto('/products');

  // Select a random product
  await productsPage.selectProduct();

  // Select size 'M'
  await productDetailsPage.selectSize('M');

  // Add the product to cart
  await productDetailsPage.addToCart();

  // Check that cart total is greater than 0
  const cartTotalValue = await productDetailsPage.cartSidebar.getCartTotal();
  expect(cartTotalValue).toBeGreaterThan(0);

  // Proceed to checkout
  await productDetailsPage.cartSidebar.proceedToCheckout();

  // Fill out customer email
  await checkoutPage.fillEmail(faker.internet.email());

  // Submit shipping address
  await checkoutPage.fillShippingAddress();
  await checkoutPage.page.getByRole('button', { name: 'Save and Continue' }).click();

  // Accept the default delivery option
  await checkoutPage.acceptDefaultShipping();

  // Submit in payment details
  await checkoutPage.fillPaymentDetail();
  await checkoutPage.page.getByRole('button', { name: 'Pay' }).click();

  await checkoutPage.fillPaymentDetail();
  await checkoutPage.page.getByRole('button', { name: 'Pay' }).click();

  /** There is a known limitation in playwright where it won't intercept redirected URLs.
   * The Playwright team has confirmed it is "by-design".
   * Issue https://github.com/microsoft/playwright/issues/3993
   * Confirmation from the team https://github.com/microsoft/playwright/pull/3994#issuecomment-700980039
   * Below I'm simulating the behavior if this bug was fixed by explicitly going to the URL and mocking the API response.
   * */
  await checkoutPage.page.goto('/checkout/${cartToken}/complete');

  // Assert that the mocked order confirmation page with 'Strawberry' client name loaded
  await expect(homePage.page.getByText('Thanks Strawberry for your order!')).toBeVisible();
  await checkoutPage.page.screenshot({ path: './screenshots/test.png' });
});
