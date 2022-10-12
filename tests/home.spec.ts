import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe.serial('Home page', () => {
	let page: Page;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
	});

	test.afterAll(async () => {
		await page.close();
	});

	test('has Home in title and get started link linking to the dashboard page @fast', async ({ page }) => {
		await page.goto('/');

		// Expect a title "to contain" a substring.
		await expect(page).toHaveTitle(/Home/);

		// create a locator
		const getStarted = page.getByText('Get Started');

		// Expect an attribute "to be strictly equal" to the value.
		await expect(getStarted).toHaveAttribute('href', '/dashboard');

		// Click the get started link.
		await getStarted.click();

		// Expects the URL to contain intro.
		await expect(page).toHaveURL(/dashboard/);
	});

	test('has H1 content @slow', async ({ page }) => {
		await page.goto('/');

		expect(await page.textContent('h1')).toBe('Combine GraphQL APIs into a unified supergraph');
	});
});