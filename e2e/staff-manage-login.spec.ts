import { test, expect } from '@playwright/test';

test.describe('Staff Manage Login Page Smoke Tests', () => {
    test.setTimeout(60000);

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

    test.beforeEach(async ({ page }) => {
        const fakeToken = createFakeToken();

        // Mock Login API
        await page.route('**/api/users/login', async route => {
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

        // Mock the GetUsers API for the staff-manage-login page
        await page.route('**/GetUsers', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: '1',
                        userName: 'Jane Doe',
                        email: 'jane@example.com',
                        role: ['Teacher'],
                        campus: 'Main Campus',
                        phoneNumber: '1234567890',
                        status: 'Active',
                        createdOn: '2023-01-01T00:00:00Z'
                    },
                    {
                        id: '2',
                        userName: 'John Smith',
                        email: 'john@example.com',
                        role: ['Accountant'],
                        campus: 'Boys Campus',
                        phoneNumber: '0987654321',
                        status: 'Inactive',
                        createdOn: '2023-02-01T00:00:00Z'
                    }
                ]),
            });
        });

        await page.goto('/sign-in');
        await page.fill('input[placeholder="Email"]', 'admin@nimvcg.com');
        await page.fill('input[placeholder="Password"]', 'Admin@123');
        await page.click('button[type="submit"]');

        // Wait for Dashboard to ensure login is complete
        await expect(page).toHaveURL(/.*dashboard/);

        // Navigate to the Staff Manage Login page
        await page.goto('/staff-manage-login');
        await expect(page.locator('.dashboard-main-body')).toBeVisible();
    });

    test('Page layout and headers are visible', async ({ page }) => {
        await expect(page.locator('h6.fw-semibold').filter({ hasText: 'Manage Logins' }).first()).toBeVisible();

        // Check structural elements of the premium redesign
        await expect(page.locator('.fee-card').first()).toBeVisible();
        await expect(page.locator('.premium-header').first()).toBeVisible();

        // Check "Add New Login" button
        const addButton = page.locator('button', { hasText: /Add New Login/i });
        await expect(addButton).toBeVisible();
        await expect(addButton).toHaveClass(/btn-primary-gradient/);
    });

    test('Data table displays mocked users', async ({ page }) => {
        // We should see two rows in the table
        const rows = page.locator('tbody tr.table-row');
        await expect(rows).toHaveCount(2);

        // Verify content of first row
        const firstRow = rows.nth(0);
        await expect(firstRow).toContainText('Jane Doe');
        await expect(firstRow).toContainText('jane@example.com');
        await expect(firstRow.locator('.amount-chip.partial')).toContainText('Teacher');
        await expect(firstRow.locator('.amount-chip.paid')).toContainText('Active');

        // Verify content of second row
        const secondRow = rows.nth(1);
        await expect(secondRow).toContainText('John Smith');
        await expect(secondRow.locator('.amount-chip.pending')).toContainText('Inactive');
    });

    test('Search filtering works', async ({ page }) => {
        const searchInput = page.locator('input.search-input');
        await searchInput.fill('Jane');

        const rows = page.locator('tbody tr.table-row');
        await expect(rows).toHaveCount(1);
        await expect(rows.nth(0)).toContainText('Jane Doe');

        await searchInput.fill('Accountant');
        await expect(rows).toHaveCount(1);
        await expect(rows.nth(0)).toContainText('John Smith');
    });

    test('Add New Login button redirects to sign-in', async ({ page }) => {
        const addButton = page.locator('button', { hasText: /Add New Login/i });
        await addButton.click();

        await expect(page).toHaveURL(/.*sign-in/);
        await expect(page.locator('h4').filter({ hasText: /Sign In/i }).first()).toBeVisible();
    });
});
