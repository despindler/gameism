const { expect, test } = require('@playwright/test');

test('authenticated office simulation renders and teaching loop works', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('ISMS Office');
  await expect(page.locator('#login-form')).toBeVisible();
  await expect(page.locator('#register-form')).toBeHidden();
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.locator('#register-form')).toBeVisible();
  await expect(page.locator('#login-form')).toBeHidden();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('#login-form')).toBeVisible();

  await page.locator('#login-form input[name="username"]').fill('visual_user');
  await page.locator('#login-form input[name="password"]').fill('visualpass123');
  await page.locator('#login-form button[type="submit"]').click();

  await expect(page.locator('#game-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Northbridge Family Practice' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Office' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Guidance' })).toBeVisible();
  await expect(page.getByText('Harden Reception PC')).toBeVisible();
  await page.getByRole('button', { name: 'Configure Reception PC' }).click();
  const guidanceDialog = page.getByRole('dialog');
  await expect(guidanceDialog).toBeVisible();
  await expect(guidanceDialog.getByText('Enable controls only when the office could demonstrate')).toBeVisible();
  await guidanceDialog.getByRole('button', { name: 'Done' }).click();
  await expect(guidanceDialog).toBeHidden();
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

  const canvasPlanStats = await page.locator('#office-canvas').evaluate((canvas) => {
    const context = canvas.getContext('2d');
    const sample = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let furniturePixels = 0;
    let corridorPixels = 0;
    const unique = new Set();

    for (let index = 0; index < sample.length; index += 4) {
      const red = sample[index];
      const green = sample[index + 1];
      const blue = sample[index + 2];
      const alpha = sample[index + 3];

      if (alpha === 0) {
        continue;
      }

      if (red === 216 && green === 200 && blue === 170) {
        furniturePixels += 1;
      }

      if (red === 237 && green === 243 && blue === 244) {
        corridorPixels += 1;
      }

      if (index % 80 === 0) {
        unique.add(`${red},${green},${blue}`);
      }
    }

    return {
      furniturePixels,
      corridorPixels,
      uniqueColors: unique.size,
    };
  });
  expect(canvasPlanStats.furniturePixels).toBeGreaterThan(100);
  expect(canvasPlanStats.corridorPixels).toBeGreaterThan(100);
  expect(canvasPlanStats.uniqueColors).toBeGreaterThan(20);

  const mapControls = page.locator('#map-view-controls');
  await expect(mapControls.getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-pressed', 'true');
  await mapControls.getByRole('button', { name: 'Audit' }).click();
  await expect(mapControls.getByRole('button', { name: 'Audit' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#map-mode-description')).toContainText('open simulated audit findings');
  const auditOverlayPixels = await page.locator('#office-canvas').evaluate((canvas) => {
    const context = canvas.getContext('2d');
    const sample = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let redPixels = 0;

    for (let index = 0; index < sample.length; index += 4) {
      const red = sample[index];
      const green = sample[index + 1];
      const blue = sample[index + 2];
      const alpha = sample[index + 3];

      if (alpha > 0 && red > 170 && green < 90 && blue < 90) {
        redPixels += 1;
      }
    }

    return redPixels;
  });
  expect(auditOverlayPixels).toBeGreaterThan(100);
  await mapControls.getByRole('button', { name: 'Evidence' }).click();
  await expect(page.locator('#map-mode-description')).toContainText('audit evidence');
  await mapControls.getByRole('button', { name: 'Overview' }).click();

  const canvas = page.locator('#office-canvas');
  const box = await canvas.boundingBox();
  const mapPadding = 20;
  const mapUnit = (box.width - mapPadding * 2) / 28;
  const mapOffsetX = mapPadding;
  const mapOffsetY = Math.max(mapPadding, (box.height - mapUnit * 18) / 2);
  await page.mouse.click(
    box.x + mapOffsetX + 4.5 * mapUnit,
    box.y + mapOffsetY + 4 * mapUnit,
  );
  const deviceDialog = page.getByRole('dialog');
  await expect(deviceDialog).toBeVisible();
  await expect(deviceDialog.getByRole('heading', { name: 'Reception PC' })).toBeVisible();
  await expect(deviceDialog.getByRole('button', { name: 'Configure' })).toBeVisible();
  await deviceDialog.getByRole('button', { name: 'Configure' }).click();
  await expect(deviceDialog.getByText('Enable controls only when the office could demonstrate')).toBeVisible();
  await expect(deviceDialog.getByText('Documented owner')).toBeVisible();
  await deviceDialog.getByRole('button', { name: 'Done' }).click();
  await expect(deviceDialog).toBeHidden();

  await page.getByRole('tab', { name: 'ISMS' }).click();
  await expect(page.getByRole('tab', { name: 'ISMS' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'ISMS Workbench' })).toBeVisible();
  await page.getByRole('button', { name: 'Risks', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Unauthorized access to Cloud EHR' })).toBeVisible();

  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Backup restore test result' })).toBeVisible();

  await page.getByRole('tab', { name: 'Teaching' }).click();
  await expect(page.getByRole('heading', { name: 'Teaching Loop' })).toBeVisible();
  await expect(page.locator('#internal-audit-stepper')).toContainText('Prepare scope');
  await expect(page.locator('#internal-audit-stepper')).toContainText('Sample gaps');
  await expect(page.locator('#internal-audit-stepper')).toContainText('Correct actions');
  await expect(page.locator('#internal-audit-stepper')).toContainText('Management review');
  await page.getByRole('button', { name: 'Start drill' }).first().click();
  await expect(page.getByText('Incident drill started.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Close phishing drill gaps|Prove containment|Make backup recovery/ })).toBeVisible();

  await page.getByRole('button', { name: 'Internal audit' }).click();
  await expect(page.getByText('Internal audit completed.')).toBeVisible();
  await expect(page.locator('#internal-audit-stepper')).toContainText('findings sampled');
  await expect(page.getByText('corrective actions created from this sample')).toBeVisible();

  await page.getByRole('tab', { name: 'Audits' }).click();
  await expect(page.getByRole('heading', { name: 'Audits' })).toBeVisible();
  await expect(page.locator('#certification-stepper')).toContainText('Evidence pack');
  await expect(page.locator('#certification-stepper')).toContainText('Risk treatment');
  await expect(page.locator('#certification-stepper')).toContainText('Readiness gate');
  await expect(page.locator('#certification-stepper')).toContainText('Certification check');
  await page.getByRole('button', { name: 'Certification audit' }).click();
  await expect(page.getByText('Audit report created.')).toBeVisible();
  await expect(page.locator('#certification-stepper')).toContainText('major');
  await expect(page.getByRole('heading', { name: 'Simulated Audit Report' })).toBeVisible();
});
