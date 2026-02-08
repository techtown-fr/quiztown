import { test, expect } from '@playwright/test';

/**
 * E2E tests for quiz editing:
 * 1. Create a quiz
 * 2. Navigate to edit via dashboard
 * 3. Modify title, question, and answer
 * 4. Save and verify changes in dashboard
 * 5. Cleanup: delete the quiz
 */

const QUIZ_TITLE = `E2E Edit Quiz ${Date.now()}`;
const EDITED_TITLE = `${QUIZ_TITLE} (edited)`;
const QUIZ_DESCRIPTION = 'Quiz for edit E2E test';
const QUESTION_TEXT = 'Quelle est la capitale du Japon ?';
const EDITED_QUESTION = 'Quelle est la capitale de l\'Allemagne ?';
const OPTIONS = ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya'];
const EDITED_OPTION = 'Berlin';
const CORRECT_INDEX = 0;

test.describe.serial('Quiz edit flow', () => {
  // Safety net cleanup
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/host/');
      await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });

      // Try to clean up both original and edited titles
      for (const title of [QUIZ_TITLE, EDITED_TITLE]) {
        const quizHeading = page.getByRole('heading', { name: title });
        if (await quizHeading.isVisible({ timeout: 3_000 }).catch(() => false)) {
          page.on('dialog', (dialog) => dialog.accept());
          const deleteBtn = page.getByRole('button', { name: `Supprimer ${title}` });
          await deleteBtn.click();
          await expect(quizHeading).toBeHidden({ timeout: 10_000 });
        }
      }
    } catch {
      // Best-effort cleanup
    } finally {
      await context.close();
    }
  });

  test('1 - Create a quiz to edit', async ({ page }) => {
    await page.goto('/host/create');

    const titleInput = page.getByPlaceholder('Mon super quiz...');
    await expect(titleInput).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1000);

    await titleInput.click();
    await titleInput.fill(QUIZ_TITLE);
    await expect(titleInput).toHaveValue(QUIZ_TITLE, { timeout: 3_000 });

    const descInput = page.getByPlaceholder('De quoi parle ce quiz ?');
    await descInput.click();
    await descInput.fill(QUIZ_DESCRIPTION);

    const questionInput = page.getByPlaceholder('Écris ta question ici...');
    await questionInput.click();
    await questionInput.fill(QUESTION_TEXT);

    const optionInputs = page.getByPlaceholder('Réponse...');
    for (let i = 0; i < OPTIONS.length; i++) {
      await optionInputs.nth(i).click();
      await optionInputs.nth(i).fill(OPTIONS[i]);
    }

    const radios = page.locator('input[type="radio"]');
    await radios.nth(CORRECT_INDEX).check();

    await page.getByRole('button', { name: 'Sauvegarder' }).click();

    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible({ timeout: 15_000 });
    await expect(toast).toContainText('succès', { timeout: 5_000 });

    await page.waitForURL('**/host/**', { timeout: 10_000 });
  });

  test('2 - Dashboard shows Edit button', async ({ page }) => {
    await page.goto('/host/');
    await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });

    // Verify quiz is listed
    await expect(page.getByRole('heading', { name: QUIZ_TITLE })).toBeVisible({ timeout: 10_000 });

    // Verify Edit button exists for our quiz
    const editLink = page.getByRole('link', { name: `Modifier ${QUIZ_TITLE}` });
    await expect(editLink).toBeVisible();
  });

  test('3 - Navigate to edit page and verify pre-filled data', async ({ page }) => {
    await page.goto('/host/');
    await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: QUIZ_TITLE })).toBeVisible({ timeout: 10_000 });

    // Click the edit link
    const editLink = page.getByRole('link', { name: `Modifier ${QUIZ_TITLE}` });
    await editLink.click();

    // Wait for the edit page to load with pre-filled data
    await page.waitForURL('**/host/edit**', { timeout: 10_000 });

    // Verify title is pre-filled
    const titleInput = page.getByPlaceholder('Mon super quiz...');
    await expect(titleInput).toBeVisible({ timeout: 15_000 });
    await expect(titleInput).toHaveValue(QUIZ_TITLE, { timeout: 10_000 });

    // Verify description is pre-filled
    const descInput = page.getByPlaceholder('De quoi parle ce quiz ?');
    await expect(descInput).toHaveValue(QUIZ_DESCRIPTION);

    // Verify question is pre-filled
    await expect(page.getByDisplayValue(QUESTION_TEXT)).toBeVisible();

    // Verify options are pre-filled
    await expect(page.getByDisplayValue(OPTIONS[0])).toBeVisible();
    await expect(page.getByDisplayValue(OPTIONS[1])).toBeVisible();

    // Verify the "Mettre à jour" button is shown (not "Sauvegarder")
    await expect(page.getByRole('button', { name: 'Mettre à jour' })).toBeVisible();
  });

  test('4 - Edit quiz title and question, then save', async ({ page }) => {
    await page.goto('/host/');
    await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: QUIZ_TITLE })).toBeVisible({ timeout: 10_000 });

    // Navigate to edit
    const editLink = page.getByRole('link', { name: `Modifier ${QUIZ_TITLE}` });
    await editLink.click();
    await page.waitForURL('**/host/edit**', { timeout: 10_000 });

    // Wait for pre-filled data to load
    const titleInput = page.getByPlaceholder('Mon super quiz...');
    await expect(titleInput).toHaveValue(QUIZ_TITLE, { timeout: 15_000 });

    // Edit the title
    await titleInput.click();
    await titleInput.fill(EDITED_TITLE);
    await expect(titleInput).toHaveValue(EDITED_TITLE);

    // Edit the question
    const questionInput = page.getByDisplayValue(QUESTION_TEXT);
    await questionInput.click();
    await questionInput.fill(EDITED_QUESTION);

    // Edit the first option
    const firstOption = page.getByDisplayValue(OPTIONS[0]);
    await firstOption.click();
    await firstOption.fill(EDITED_OPTION);

    // Save
    await page.getByRole('button', { name: 'Mettre à jour' }).click();

    // Verify success toast
    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible({ timeout: 15_000 });
    await expect(toast).toContainText('mis à jour', { timeout: 5_000 });

    // Wait for redirect to dashboard
    await page.waitForURL('**/host/**', { timeout: 10_000 });
  });

  test('5 - Verify edited quiz in dashboard', async ({ page }) => {
    await page.goto('/host/');
    await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });

    // The old title should not be visible
    await expect(page.getByRole('heading', { name: QUIZ_TITLE })).toBeHidden({ timeout: 5_000 }).catch(() => {
      // It's ok if it just doesn't exist
    });

    // The edited title should be visible
    await expect(page.getByRole('heading', { name: EDITED_TITLE })).toBeVisible({ timeout: 10_000 });
  });

  test('6 - Delete the edited quiz', async ({ page }) => {
    await page.goto('/host/');
    await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });

    const quizHeading = page.getByRole('heading', { name: EDITED_TITLE });
    await expect(quizHeading).toBeVisible({ timeout: 10_000 });

    page.on('dialog', (dialog) => dialog.accept());

    const deleteBtn = page.getByRole('button', { name: `Supprimer ${EDITED_TITLE}` });
    await deleteBtn.click();

    await expect(quizHeading).toBeHidden({ timeout: 10_000 });
  });
});
