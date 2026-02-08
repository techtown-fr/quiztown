import { test, expect } from '@playwright/test';

/**
 * E2E tests for the full quiz lifecycle:
 * 1. Create a quiz via the editor
 * 2. Verify it appears on the dashboard
 * 3. Launch it and verify the ControlDeck loads
 * 4. Delete the quiz and verify it disappears
 *
 * Tests run sequentially and share the same quiz title.
 * afterAll cleans up any leftover test quizzes as a safety net.
 */

const QUIZ_TITLE = `E2E Quiz ${Date.now()}`;
const QUIZ_DESCRIPTION = 'Quiz created by Playwright E2E test';
const QUESTION_TEXT = 'Quelle est la capitale de la France ?';
const OPTIONS = ['Paris', 'Lyon', 'Marseille', 'Toulouse'];
const CORRECT_INDEX = 0; // Paris

test.describe.serial('Quiz creation and launch flow', () => {
  // Safety net: if tests fail mid-way, try to clean up the quiz
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/host/');
      await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });

      // Check if our test quiz still exists
      const quizHeading = page.getByRole('heading', { name: QUIZ_TITLE });
      if (await quizHeading.isVisible({ timeout: 3_000 }).catch(() => false)) {
        // Accept the confirm dialog before clicking delete
        page.on('dialog', (dialog) => dialog.accept());

        // Find the delete button for our quiz
        const deleteBtn = page.getByRole('button', { name: `Supprimer ${QUIZ_TITLE}` });
        await deleteBtn.click();

        // Wait for the quiz to disappear
        await expect(quizHeading).toBeHidden({ timeout: 10_000 });
      }
    } catch {
      // Best-effort cleanup, don't fail the suite
    } finally {
      await context.close();
    }
  });

  test('1 - Create a quiz', async ({ page }) => {
    await page.goto('/host/create');

    // Wait for the editor inputs to be interactive (React hydrated)
    const titleInput = page.getByPlaceholder('Mon super quiz...');
    await expect(titleInput).toBeVisible({ timeout: 15_000 });

    // Wait for React hydration to complete
    await page.waitForTimeout(1000);

    // Fill title and verify it took effect
    await titleInput.click();
    await titleInput.fill(QUIZ_TITLE);
    await expect(titleInput).toHaveValue(QUIZ_TITLE, { timeout: 3_000 });

    // Fill description
    const descInput = page.getByPlaceholder('De quoi parle ce quiz ?');
    await descInput.click();
    await descInput.fill(QUIZ_DESCRIPTION);

    // Fill question text
    const questionInput = page.getByPlaceholder('Écris ta question ici...');
    await questionInput.click();
    await questionInput.fill(QUESTION_TEXT);

    // Fill the 4 answer options
    const optionInputs = page.getByPlaceholder('Réponse...');
    for (let i = 0; i < OPTIONS.length; i++) {
      await optionInputs.nth(i).click();
      await optionInputs.nth(i).fill(OPTIONS[i]);
    }

    // Mark the correct answer (first radio button)
    const radios = page.locator('input[type="radio"]');
    await radios.nth(CORRECT_INDEX).check();

    // Double-check title before save
    await expect(titleInput).toHaveValue(QUIZ_TITLE);

    // Save
    await page.getByRole('button', { name: 'Sauvegarder' }).click();

    // Verify success toast
    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible({ timeout: 15_000 });
    await expect(toast).toContainText('succès', { timeout: 5_000 });

    // Wait for redirect to dashboard
    await page.waitForURL('**/host/**', { timeout: 10_000 });
  });

  test('2 - Quiz appears in dashboard', async ({ page }) => {
    await page.goto('/host/');

    // Wait for quizzes to load
    await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });

    // Verify our quiz is listed
    await expect(page.getByRole('heading', { name: QUIZ_TITLE })).toBeVisible({ timeout: 10_000 });

    // Verify Launch buttons exist
    await expect(page.getByRole('button', { name: /Lancer/ }).first()).toBeVisible();
  });

  test('3 - Launch a quiz', async ({ page }) => {
    await page.goto('/host/');

    // Wait for quizzes to load
    await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByText(QUIZ_TITLE)).toBeVisible({ timeout: 10_000 });

    // Click the first Launch button (our quiz should be first, ordered by date desc)
    await page.getByRole('button', { name: /Lancer/ }).first().click();

    // Wait for navigation to the live page with a session query param
    await page.waitForURL('**/host/live/**session=**', { timeout: 15_000 });

    // Verify the ControlDeck UI loads
    await expect(page.getByText('ControlDeck')).toBeVisible({ timeout: 15_000 });

    // Verify session is in lobby status
    await expect(page.getByText('Lobby')).toBeVisible({ timeout: 10_000 });
  });

  test('4 - Delete a quiz', async ({ page }) => {
    await page.goto('/host/');

    // Wait for quizzes to load
    await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });

    // Verify our quiz is visible
    const quizHeading = page.getByRole('heading', { name: QUIZ_TITLE });
    await expect(quizHeading).toBeVisible({ timeout: 10_000 });

    // Accept the confirm dialog when it appears
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete on our quiz
    const deleteBtn = page.getByRole('button', { name: `Supprimer ${QUIZ_TITLE}` });
    await deleteBtn.click();

    // Verify the quiz disappears from the dashboard
    await expect(quizHeading).toBeHidden({ timeout: 10_000 });
  });
});
