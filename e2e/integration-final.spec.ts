import { test, expect } from '@playwright/test';

test.describe('Final Integration & Automation Tests', () => {
    test.setTimeout(180000);

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

        // Mock Login
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

        // Mock Settings GET
        await page.route('**/api/settings', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    instituteName: 'Test Academy',
                    institutePhone: '123456789',
                    instituteAddress: '123 Street',
                    instituteEmail: 'test@academy.com',
                    currencySymbol: 'PKR'
                }),
            });
        });

        // Mock Settings POST
        await page.route('**/api/settings/general', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true }),
            });
        });

        // Mock Notifications GET
        await page.route('**/api/notifications/logs', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { recipientName: 'John Doe', recipientEmail: 'john@test.com', notificationType: 'Fee Alert', status: 'Sent', createdAt: new Date() }
                ]),
            });
        });

        // Mock Grade Scales
        await page.route('**/api/GradeScales', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { gradeId: 1, grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 4.0 }
                ]),
            });
        });

        // Mock Exams
        await page.route('**/api/ExamSchedules/GetExamScheduleOptions', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { examScheduleId: 1, examScheduleName: 'Mid Term 2024' }
                ]),
            });
        });

        // Mock Profit & Loss
        await page.route('**/api/Accounts/profit-loss*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    totalIncome: 500000,
                    totalExpenses: 200000,
                    netProfit: 300000,
                    incomeByCategory: [{ category: 'Fees', amount: 500000 }],
                    expenseByCategory: [{ category: 'Salaries', amount: 200000 }]
                }),
            });
        });

        // Mock Exam Analytics
        await page.route('**/api/Analytics/exam/*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    examName: 'Mid Term 2024',
                    totalStudents: 100,
                    passedStudents: 90,
                    failedStudents: 10,
                    averagePercentage: 85,
                    gradeDistribution: [{ grade: 'A', count: 50, percentage: 50 }]
                }),
            });
        });

        await page.goto('/sign-in');
        await page.fill('input[placeholder="Email"]', 'admin@nimvcg.com');
        await page.fill('input[placeholder="Password"]', 'Admin@123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('Admin Settings Persistence Workflow', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.locator('.settings-container')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('h3')).toContainText('General Administration');

        // Update Name - try multiple selectors
        const nameInput = page.locator('input').filter({ hasText: '' }).first(); // Fallback if placeholder is tricky
        const nameInputByPlaceholder = page.locator('input[placeholder*="Modern School"]');

        await expect(nameInputByPlaceholder).toBeVisible();
        await nameInputByPlaceholder.clear();
        await nameInputByPlaceholder.fill('Updated Noshahi Institute');

        // Click Save
        await page.click('button:has-text("Save Changes")');

        // Success notification check
        await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 10000 });
        await page.click('.swal2-confirm');

        // Verify value stayed
        await expect(nameInputByPlaceholder).toHaveValue('Updated Noshahi Institute');
    });

    test('Automated Grading Workflow Visibility', async ({ page }) => {
        await page.goto('/auto-grade-calculation');
        await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.fee-card-header h4')).toContainText('Auto Generate Exam Results');

        // Verify Calculate Button exists
        const calcButton = page.locator('button:has-text("Calculate Grades")');
        await expect(calcButton).toBeVisible();
        await expect(calcButton).not.toBeDisabled();
    });

    test('Analytics & Reports Integrity', async ({ page }) => {
        // Profit & Loss
        await page.goto('/profit-loss');
        await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });
        // Check for common chart containers or canvas
        await expect(page.locator('canvas, .apexcharts-canvas').first()).toBeVisible({ timeout: 15000 });

        // Exam Analytics
        await page.goto('/exam-analytics');
        await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('canvas, .apexcharts-canvas').first()).toBeVisible({ timeout: 15000 });
    });

    test('Notification Monitoring Verification', async ({ page }) => {
        await page.goto('/settings');
        await page.click('button:has-text("Notifications")');

        await expect(page.locator('h3:has-text("Recent Notification Logs")')).toBeVisible({ timeout: 10000 });

        // Verify table has data
        const tableRow = page.locator('table.glass-table tbody tr').first();
        await expect(tableRow).toContainText('John Doe', { timeout: 10000 });
        await expect(tableRow).toContainText('Sent');
    });
});
