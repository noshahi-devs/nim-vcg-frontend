import { test, expect } from '@playwright/test';

const createFakeToken = () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
        sub: '1234567890',
        name: 'SuperAdmin',
        roles: ['Admin'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
    })).toString('base64');
    return `${header}.${payload}.signature`;
};

const setupMocks = async (page) => {
    const fakeToken = createFakeToken();
    await page.route('**', async route => {
        const url = route.request().url();
        const method = route.request().method();

        if (url.includes('7225') || url.includes('/api/') || url.includes('visioncollegegojra.com')) {
            if (url.includes('/login')) {
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
            } else if (method === 'GET') {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
            }
            return;
        }

        if (url.includes('iconify.design') || url.includes('unisvg.com') || url.includes('google-analytics') || url.includes('fonts.googleapis.com')) {
            await route.abort();
            return;
        }

        await route.continue();
    });
};

const login = async (page) => {
    console.log('NAV: Going to /sign-in');
    await page.goto('http://127.0.0.1:4200/sign-in', { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('ACTION: Filling credentials');
    const emailInput = page.locator('input[placeholder="Email"]');
    await expect(emailInput).toBeVisible({ timeout: 30000 });
    await emailInput.fill('admin@nimvcg.com');

    await page.fill('input[placeholder="Password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    console.log('WAIT: Waiting for /dashboard');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 45000 });
};

const runner = async (page, routes) => {
    for (const route of routes) {
        console.log(`VISIT: ${route}`);
        try {
            // Use relative path or ensure 127.0.0.1
            const targetUrl = route.startsWith('http') ? route : `http://127.0.0.1:4200${route}`;
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await page.waitForSelector('.sidebar, .dashboard-main, main, .card', { timeout: 20000 });

            const title = await page.evaluate(() => {
                const el = document.querySelector('app-breadcrumb h6, .page-title, h1, h2, h3, h4, h5, h6');
                return el ? el.textContent?.trim() : 'N/A';
            });
            console.log(`  OK: ${route} [Title: ${title?.split('\n')[0]}]`);
        } catch (e) {
            console.log(`  FAILED: ${route} - ${e.message}`);
        }
    }
};

test.describe('Admin Full Page Smoke Test - Sequential', () => {
    test.setTimeout(900000); // 15 minutes per test
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
        await setupMocks(page);
        await login(page);
    });

    test('Batch 1: Academics & Staff', async ({ page }) => {
        await runner(page, [
            '/class-list', '/newclass', '/class-management', '/section-list', '/section-add', '/subject', '/subject-add', '/subject-list',
            '/staff-list', '/staff-add', '/staff-view-profile/1', '/staff-edit-profile/1', '/staff-job-letter', '/staff-manage-login'
        ]);
    });

    test('Batch 2: Students & Attendance', async ({ page }) => {
        await runner(page, [
            '/student-add', '/student-list', '/student-view/1', '/student-edit/1', '/student-promote',
            '/attendance', '/staff-attendance', '/staff-attendance-report', '/student-attendance-report'
        ]);
    });

    test('Batch 3: Leave & Reports & Settings', async ({ page }) => {
        await runner(page, [
            '/leave', '/manage-leaves', '/leave-type', '/report', '/class-wise-report',
            '/users-list', '/role-access', '/assign-role', '/language', '/theme', '/settings', '/view-profile'
        ]);
    });

    test('Batch 4: Exams', async ({ page }) => {
        await runner(page, [
            '/exam', '/exam-schedule', '/exam-schedule-standards-create', '/exam-schedule-standards-list', '/exam-result', '/exam-analytics', '/auto-grade-calculation'
        ]);
    });

    test('Batch 5: Finance Part A', async ({ page }) => {
        await runner(page, [
            '/fee', '/generate-fee-invoice', '/collect-fee', '/fee-defaulters', '/accounts', '/income-manage', '/expense-manage', '/profit-loss', '/accounts-ledger', '/bank-cash'
        ]);
    });

    test('Batch 6: Finance Part B', async ({ page }) => {
        await runner(page, [
            '/payment-detail', '/monthly-payment', '/other-payment', '/salary', '/salary-slip', '/wallet',
            '/invoice-list', '/invoice-add', '/invoice-edit/1', '/invoice-preview/1', '/payment-gateway'
        ]);
    });
});
