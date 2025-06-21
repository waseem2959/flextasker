/**
 * Basic Navigation E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check for navigation elements
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check for footer
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click login link
    await page.getByRole('link', { name: /login/i }).click();
    
    // Should be on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('can navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    // Click register link
    await page.getByRole('link', { name: /register|sign up/i }).click();
    
    // Should be on register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: /register|sign up/i })).toBeVisible();
  });

  test('can navigate to browse tasks', async ({ page }) => {
    await page.goto('/');
    
    // Click browse tasks link
    await page.getByRole('link', { name: /browse tasks/i }).click();
    
    // Should be on tasks page
    await expect(page).toHaveURL(/.*tasks/);
  });

  test('responsive navigation works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Mobile menu should be visible
    const mobileMenu = page.getByRole('button', { name: /menu/i });
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});

test.describe('PWA Features', () => {
  test('service worker is registered', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistrations();
    });
    
    expect(swRegistration.length).toBeGreaterThan(0);
  });

  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    expect(response.status()).toBe(200);
    
    const manifest = await response.json();
    expect(manifest.name).toContain('Flextasker');
    expect(manifest.icons).toBeDefined();
    expect(manifest.start_url).toBeDefined();
  });

  test('offline page exists', async ({ page }) => {
    const response = await page.request.get('/offline.html');
    expect(response.status()).toBe(200);
  });
});