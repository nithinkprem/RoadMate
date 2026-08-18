import { test, expect } from '../src/fixtures/test-fixtures';
import AxeBuilder from '@axe-core/playwright';

/**
 * Real automated accessibility scans using axe-core, run against the
 * highest-traffic customer pages. This supplements (rather than replaces)
 * the manual landmark/focus checks in admin-actions.spec.ts, which verify
 * specific UX behaviors axe cannot assert on its own.
 */
test.describe('Accessibility (axe-core scans)', () => {
  test('home page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('admin analytics dashboard has no critical accessibility violations', async ({
    adminAuthedPage,
  }) => {
    const results = await new AxeBuilder({ page: adminAuthedPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});

function formatViolations(violations: { id: string; help: string; nodes: unknown[] }[]) {
  return violations
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s))`)
    .join('\n');
}
