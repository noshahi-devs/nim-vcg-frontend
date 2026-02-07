import { test, expect } from '@playwright/test';

test.describe('Admin Flow Smoke Tests', () => {
    // Increase timeout for the whole suite
    test.setTimeout(180000);

    // Helper to create a fake but valid-looking JWT for the AuthService
    const createFakeToken = () => {
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
        const payload = Buffer.from(JSON.stringify({
            sub: '1234567890',
            name: 'SuperAdmin',
            roles: ['Admin'],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour in future
        })).toString('base64');
        return `${header}.${payload}.signature`;
    };

    test('Sign-in page loads', async ({ page }) => {
        await page.goto('/sign-in');
        await expect(page.locator('h4')).toContainText(/Sign In/i);
    });

    test.beforeEach(async ({ page }) => {
        // Log console messages
        page.on('console', msg => console.log(`PAGE LOG [${msg.type()}]: ${msg.text()}`));
        page.on('pageerror', err => console.log('PAGE ERROR: ' + err.message));

        const fakeToken = createFakeToken();

        // 1. Mock Login API to bypass real auth for smoke testing
        await page.route('**/api/users/login', async route => {
            console.log('MOCKING: Intercepted login request');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: fakeToken,
                    username: 'SuperAdmin',
                    roles: ['Admin'],
                    permissions: []
                }),
            });
        });

        // 2. Go to Sign In
        console.log('NAV: Navigating to sign-in');
        await page.goto('/sign-in');
        await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 15000 });

        // 3. Perform Login
        console.log('ACTION: Filling login form');
        await page.fill('input[placeholder="Email"]', 'admin@nimvcg.com');
        await page.fill('input[placeholder="Password"]', 'Admin@123');
        await page.click('button[type="submit"]');

        // 4. Wait for Dashboard - increase timeout for navigation
        console.log('NAV: Waiting for dashboard URL');
        try {
            await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
        } catch (e) {
            console.log('FAILED URL: Current URL is ' + page.url());
            throw e;
        }

        // Ensure side layout is loaded
        console.log('CHECK: Waiting for sidebar');
        await expect(page.locator('.sidebar')).toBeVisible({ timeout: 30000 });
        console.log('CHECK: Sidebar is visible');
    });

    test('Ensure Dashboard Loads', async ({ page }) => {
        await expect(page.locator('main.dashboard-main')).toBeVisible();
        const dashboardBody = page.locator('.dashboard-main-body');
        await expect(dashboardBody).toBeVisible({ timeout: 15000 });
        // Use a more specific locator for the main title to avoid strict mode violations
        const mainTitle = page.locator('app-breadcrumb h6, .page-title').first();
        await expect(mainTitle).toContainText(/Dashboard|Workspace/i);
    });

    test('Academic Management Smoke Test', async ({ page }) => {
        const routes = ['/class-list', '/newclass', '/class-management', '/section-list', '/section-add', '/subject-list', '/subject-add'];
        for (const route of routes) {
            console.log(`NAV: Visiting ${route}`);
            await page.goto(route);
            await expect(page.locator('.sidebar')).toBeVisible();
            await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });
        }
    });

    test('Staff & Student Management Smoke Test', async ({ page }) => {
        const routes = ['/staff-list', '/staff-add', '/student-list', '/student-add', '/student-promote'];
        for (const route of routes) {
            console.log(`NAV: Visiting ${route}`);
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('.sidebar')).toBeVisible();
            // Using a more general selector if dashboard body fails
            const content = page.locator('.dashboard-main-body, .card');
            await expect(content.first()).toBeVisible({ timeout: 15000 });
        }
    });

    test('Finance & Fees Smoke Test', async ({ page }) => {
        const routes = ['/fee', '/generate-fee-invoice', '/fee-defaulters', '/accounts', '/income-manage', '/expense-manage', '/profit-loss'];
        for (const route of routes) {
            console.log(`NAV: Visiting ${route}`);
            await page.goto(route);
            await expect(page.locator('.sidebar')).toBeVisible();
            await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });
        }
    });

    test('Exams & Leaves Smoke Test', async ({ page }) => {
        const routes = ['/exam', '/exam-schedule', '/exam-result', '/exam-analytics', '/leave', '/manage-leaves', '/leave-type'];
        for (const route of routes) {
            console.log(`NAV: Visiting ${route}`);
            await page.goto(route);
            await expect(page.locator('.sidebar')).toBeVisible();
            await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });
        }
    });

    test('System Settings Smoke Test', async ({ page }) => {
        const routes = ['/role-access', '/assign-role', '/language', '/theme'];
        for (const route of routes) {
            console.log(`NAV: Visiting ${route}`);
            await page.goto(route);
            await expect(page.locator('.sidebar')).toBeVisible();
            await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });
        }
    });

});
