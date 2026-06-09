const { expect, test } = require('@playwright/test');

test('authenticated office simulation renders and teaching loop works', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('ISMS Office');

  await page.locator('#login-form input[name="username"]').fill('visual_user');
  await page.locator('#login-form input[name="password"]').fill('visualpass123');
  await page.locator('#login-form button[type="submit"]').click();

  await expect(page.locator('#game-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Northbridge Family Practice' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Office' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#office-canvas')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ISMS Workbench' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Teaching Loop' })).toBeHidden();

  const canvasBox = await page.locator('#office-canvas').boundingBox();
  expect(canvasBox.width).toBeGreaterThan(300);
  expect(canvasBox.height).toBeGreaterThan(300);

  const canvasHasPixels = await page.locator('#office-canvas').evaluate((canvas) => {
    const context = canvas.getContext('2d');
    const sample = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 3; index < sample.length; index += 4) {
      if (sample[index] !== 0) {
        return true;
      }
    }
    return false;
  });
  expect(canvasHasPixels).toBe(true);

  await page.getByRole('tab', { name: 'ISMS' }).click();
  await expect(page.getByRole('tab', { name: 'ISMS' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'ISMS Workbench' })).toBeVisible();
  await page.getByRole('button', { name: 'Risks' }).click();
  await expect(page.getByRole('heading', { name: 'Unauthorized access to Cloud EHR' })).toBeVisible();

  await page.getByRole('button', { name: 'Evidence' }).click();
  await expect(page.getByRole('heading', { name: 'Backup restore test result' })).toBeVisible();

  await page.getByRole('tab', { name: 'Teaching' }).click();
  await expect(page.getByRole('heading', { name: 'Teaching Loop' })).toBeVisible();
  await page.getByRole('button', { name: 'Start drill' }).first().click();
  await expect(page.getByText('Incident drill started.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Close phishing drill gaps|Prove containment|Make backup recovery/ })).toBeVisible();

  await page.getByRole('button', { name: 'Internal audit' }).click();
  await expect(page.getByText('Internal audit completed.')).toBeVisible();
  await expect(page.getByText('corrective actions created from this sample')).toBeVisible();

  await page.getByRole('tab', { name: 'Audits' }).click();
  await expect(page.getByRole('heading', { name: 'Audits' })).toBeVisible();
  await page.getByRole('button', { name: 'Certification audit' }).click();
  await expect(page.getByText('Audit report created.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Simulated Audit Report' })).toBeVisible();
});
