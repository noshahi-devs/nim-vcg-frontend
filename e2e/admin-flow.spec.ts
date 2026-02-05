import { test, expect } from '@playwright/test';

test.describe('Admin Flow Tests', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Mock Login API
        await page.route('**/api/users/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'mock-jwt-token',
                    username: 'admin',
                    roles: ['Admin'],
                    permissions: []
                }),
            });
        });

        // 2. Go to Sign In
        await page.goto('/sign-in');

        // 3. Perform Login
        await page.fill('input[placeholder="Enter email address"]', 'admin@example.com');
        await page.fill('input[placeholder="Enter password"]', 'password');
        await page.click('button[type="submit"]');

        // 4. Wait for Dashboard
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('Navigate through Blog Management', async ({ page }) => {
        await page.goto('/blog');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/Blog/i);

        await page.goto('/add-blog');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/Add Blog/i);
    });

    test('Navigate through User Management', async ({ page }) => {
        await page.goto('/users-list');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/User/i);

        await page.goto('/users-grid');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/User/i);
    });

    test('Navigate through Settings', async ({ page }) => {
        await page.goto('/company');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/Company/i);

        await page.goto('/theme');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/Theme/i);
    });

    test('Navigate through Marketplace', async ({ page }) => {
        await page.goto('/marketplace');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/Marketplace/i);
    });

    test('Navigate through Core School Features', async ({ page }) => {
        await page.goto('/class-list');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/Class/i);

        await page.goto('/staff-list');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/Employees/i);

        await page.goto('/student-list');
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/Student/i);
    });

});
