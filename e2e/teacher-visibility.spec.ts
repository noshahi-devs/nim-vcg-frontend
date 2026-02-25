import { test, expect } from '@playwright/test';

test.describe('Teacher Visibility E2E Tests', () => {
    test.setTimeout(120000);

    const TEACHER_EMAIL = 'teacher@gmail.com';
    const TEACHER_STAFF_ID = 777;

    const createFakeToken = () => {
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
        const payload = Buffer.from(JSON.stringify({
            sub: 'teacher123',
            name: 'Teacher User',
            roles: ['Teacher'],
            email: TEACHER_EMAIL,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60)
        })).toString('base64');
        return `${header}.${payload}.signature`;
    };

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => require('fs').appendFileSync('browser-logs.txt', 'CONSOLE: ' + msg.text() + '\\n'));
        page.on('response', resp => require('fs').appendFileSync('browser-logs.txt', `RESP: ${resp.url()} ${resp.status()}\\n`));

        // Abort all unhandled API requests to prevent hanging network calls when backend is down
        await page.route('**/api/**', async route => {
            console.log('Aborting unhandled API request:', route.request().url());
            await route.abort();
        });

        const fakeToken = createFakeToken();

        // Mock Login API
        await page.route('**/api/users/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: fakeToken,
                    username: 'TeacherUser',
                    roles: ['Teacher'],
                    email: TEACHER_EMAIL,
                    permissions: []
                }),
            });
        });

        // Mock Staff API
        await page.route('**/api/Staffs', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { staffId: TEACHER_STAFF_ID, staffName: 'Teacher User', email: TEACHER_EMAIL, designation: 50 },
                    { staffId: 888, staffName: 'Other Teacher', email: 'other@gmail.com', designation: 50 }
                ]),
            });
        });

        // Mock Sections API
        await page.route('**/api/Sections', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { sectionId: 1, sectionName: 'A', className: 'Class 10', staffId: TEACHER_STAFF_ID },
                    { sectionId: 2, sectionName: 'B', className: 'Class 9', staffId: 888 }
                ]),
            });
        });

        // Mock Standards (Classes) API
        await page.route('**/api/Standards', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { standardId: 10, standardName: 'Class 10' },
                    { standardId: 9, standardName: 'Class 9' }
                ]),
            });
        });

        // Mock Students API
        await page.route('**/api/Students', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { studentId: 101, studentName: 'Assigned Student', standardId: 10, section: 'A' },
                    { studentId: 202, studentName: 'Hidden Student', standardId: 9, section: 'B' }
                ]),
            });
        });

        // Mock Subjects API
        await page.route('**/api/Subjects', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { subjectId: 1, subjectName: 'Math', standard: { standardName: 'Class 10' } },
                    { subjectId: 2, subjectName: 'History', standard: { standardName: 'Class 9' } }
                ]),
            });
        });

        // Navigate to sign-in and login
        await page.goto('/sign-in');
        await page.fill('input[placeholder="Email"]', TEACHER_EMAIL);
        await page.fill('input[placeholder="Password"]', 'Teacher@123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('Teacher should only see assigned students in Student List', async ({ page }) => {
        // SPA navigation
        await page.locator('text=Student').first().click();
        await page.locator('text=Student List').first().click();

        await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });

        // Verify Student List filtering
        const studentCards = page.locator('.card'); // Assuming students are in cards
        await expect(page.locator('text=Assigned Student')).toBeVisible();
        await expect(page.locator('text=Hidden Student')).not.toBeVisible();

        // Verify Class filter only shows assigned class
        const classSelect = page.locator('select').nth(1); // The class filter is the second select
        await expect(classSelect.locator('option')).toHaveCount(2); // Default + Class 10
        await expect(classSelect).toContainText('Class 10');
        await expect(classSelect).not.toContainText('Class 9');
    });

    test('Teacher should only see assigned classes in Class Management', async ({ page }) => {
        // SPA navigation
        await page.locator('text=Class').first().click();
        await page.locator('text=Class Manage').first().click();

        await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });

        await expect(page.locator('text=Class 10')).toBeVisible();
        await expect(page.locator('text=Class 9')).not.toBeVisible();
    });

    test('Teacher should only see assigned sections in Section List', async ({ page }) => {
        // SPA navigation
        await page.locator('text=Section').first().click();
        await page.locator('text=Section List').first().click();

        await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });

        await expect(page.locator('.student-name-title', { hasText: 'A' }).first()).toBeVisible();
        await expect(page.locator('.student-name-title', { hasText: 'B' })).not.toBeVisible();
    });

    test('Teacher should only see subjects for assigned classes in Subject List', async ({ page }) => {
        // SPA navigation
        await page.locator('text=Subject').first().click();
        await page.locator('text=All Subjects').first().click();

        await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });

        await expect(page.locator('text=Math')).toBeVisible();
        await expect(page.locator('text=History')).not.toBeVisible();
    });

    test('Teacher should only see assigned classes in Attendance', async ({ page }) => {
        // SPA navigation
        await page.locator('span:has-text("Attendance")').first().click();
        await page.locator('text=Student Attendance').first().click();

        await expect(page.locator('.dashboard-main-body')).toBeVisible({ timeout: 15000 });

        const classSelect = page.locator('select').first();
        await expect(classSelect).toContainText('Class 10');
        await expect(classSelect).not.toContainText('Class 9');
    });
});
