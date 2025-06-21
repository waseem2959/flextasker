/**
 * Accessibility E2E Tests
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('homepage has no accessibility violations', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('login page has no accessibility violations', async ({ page }) => {
    await page.goto('/login');
    await checkA11y(page);
  });

  test('keyboard navigation works', async ({ page }) => {
    // Start at the top of the page
    await page.keyboard.press('Tab');
    
    // Should focus on skip link
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeFocused();
    
    // Press Enter on skip link
    await page.keyboard.press('Enter');
    
    // Main content should be focused
    const main = page.getByRole('main');
    await expect(main).toBeFocused();
  });

  test('screen reader landmarks are present', async ({ page }) => {
    // Check for main landmark
    await expect(page.getByRole('main')).toBeVisible();
    
    // Check for navigation landmark
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check for contentinfo landmark (footer)
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('images have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/login');
    
    const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      
      // Check for associated label or aria-label
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('color contrast is sufficient', async ({ page }) => {
    // This would typically use axe-core rules for color contrast
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  test('focus is visible on interactive elements', async ({ page }) => {
    const buttons = page.getByRole('button');
    const links = page.getByRole('link');
    
    // Test a few buttons
    const buttonCount = Math.min(await buttons.count(), 3);
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await button.focus();
        // Visual focus test would require screenshot comparison
        // For now, just ensure the element can be focused
        await expect(button).toBeFocused();
      }
    }
    
    // Test a few links
    const linkCount = Math.min(await links.count(), 3);
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        await link.focus();
        await expect(link).toBeFocused();
      }
    }
  });
});