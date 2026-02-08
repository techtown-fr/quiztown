import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * E2E tests for the full live session flow:
 * 1. Create a quiz via the editor
 * 2. Launch it -- verify QR code + join link in lobby
 * 3. A player joins via the join link
 * 4. Host clicks "Démarrer" -- first question starts, timer visible, question preview (text + pictograms + answers) on ControlDeck
 * 5. Player answers -- auto-advance: all answered → reveal → leaderboard
 * 6. Host finishes session ("Terminer le quiz" since last question)
 * 7. Cleanup: delete the quiz
 *
 * The flow is LINEAR per question: question → feedback → leaderboard → next/finish.
 * When all players have answered, the system auto-advances (reveal + leaderboard).
 * The host only needs to click "Question suivante" or "Terminer le quiz".
 *
 * Uses two browser contexts: one for the host, one for the player.
 * Both are created manually so they persist across serial tests.
 */

const QUIZ_TITLE = `E2E Live ${Date.now()}`;
const QUIZ_DESCRIPTION = 'Live session E2E test';
const QUESTION_TEXT = 'Quel langage est utilisé pour le web ?';
const OPTIONS = ['JavaScript', 'Cobol', 'Fortran', 'Pascal'];
const CORRECT_INDEX = 0; // JavaScript

let hostContext: BrowserContext;
let hostPage: Page;
let playerContext: BrowserContext;
let playerPage: Page;
let joinUrl: string;

test.describe.serial('Live session flow', () => {
  // Create a persistent host context before all tests
  test.beforeAll(async ({ browser }) => {
    hostContext = await browser.newContext();
    hostPage = await hostContext.newPage();
  });

  // Cleanup: close contexts and delete the test quiz
  test.afterAll(async ({ browser }) => {
    // Close player context
    if (playerContext) {
      await playerContext.close().catch(() => {});
    }
    // Close host context
    if (hostContext) {
      await hostContext.close().catch(() => {});
    }

    // Cleanup quiz
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/host/');
      await expect(page.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });

      const quizHeading = page.getByRole('heading', { name: QUIZ_TITLE });
      if (await quizHeading.isVisible({ timeout: 3_000 }).catch(() => false)) {
        page.on('dialog', (dialog) => dialog.accept());
        const deleteBtn = page.getByRole('button', { name: `Supprimer ${QUIZ_TITLE}` });
        await deleteBtn.click();
        await expect(quizHeading).toBeHidden({ timeout: 10_000 });
      }
    } catch {
      // Best-effort cleanup
    } finally {
      await context.close();
    }
  });

  test('1 - Create a quiz', async () => {
    await hostPage.goto('/host/create');

    // Wait for editor hydration
    const titleInput = hostPage.getByPlaceholder('Mon super quiz...');
    await expect(titleInput).toBeVisible({ timeout: 15_000 });
    await hostPage.waitForTimeout(1000);

    // Fill quiz metadata
    await titleInput.click();
    await titleInput.fill(QUIZ_TITLE);
    await expect(titleInput).toHaveValue(QUIZ_TITLE, { timeout: 3_000 });

    const descInput = hostPage.getByPlaceholder('De quoi parle ce quiz ?');
    await descInput.click();
    await descInput.fill(QUIZ_DESCRIPTION);

    // Fill first question
    const questionInput = hostPage.getByPlaceholder('Écris ta question ici...');
    await questionInput.click();
    await questionInput.fill(QUESTION_TEXT);

    const optionInputs = hostPage.getByPlaceholder('Réponse...');
    for (let i = 0; i < OPTIONS.length; i++) {
      await optionInputs.nth(i).click();
      await optionInputs.nth(i).fill(OPTIONS[i]);
    }

    // Mark correct answer
    const radios = hostPage.locator('input[type="radio"]');
    await radios.nth(CORRECT_INDEX).check();

    // Save
    await hostPage.getByRole('button', { name: 'Sauvegarder' }).click();

    // Verify success
    const toast = hostPage.getByRole('alert');
    await expect(toast).toBeVisible({ timeout: 15_000 });
    await expect(toast).toContainText('succès', { timeout: 5_000 });

    await hostPage.waitForURL('**/host/**', { timeout: 10_000 });
  });

  test('2 - Launch quiz and verify QR code + join link', async () => {
    await hostPage.goto('/host/');

    // Wait for dashboard
    await expect(hostPage.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });
    await expect(hostPage.getByText(QUIZ_TITLE)).toBeVisible({ timeout: 10_000 });

    // Launch the quiz
    await hostPage.getByRole('button', { name: /Lancer/ }).first().click();

    // Wait for live page
    await hostPage.waitForURL('**/host/live/**session=**', { timeout: 15_000 });

    // Verify ControlDeck loads
    await expect(hostPage.getByText('ControlDeck')).toBeVisible({ timeout: 15_000 });
    await expect(hostPage.getByText('Lobby')).toBeVisible({ timeout: 10_000 });

    // Verify QR code is displayed
    const qrImage = hostPage.locator('img[alt*="QR"]');
    await expect(qrImage).toBeVisible({ timeout: 10_000 });

    // Verify join URL is displayed
    const joinUrlElement = hostPage.locator('[data-testid="join-url"]');
    await expect(joinUrlElement).toBeVisible({ timeout: 5_000 });

    // Extract the join URL for the player
    joinUrl = await joinUrlElement.textContent() ?? '';
    expect(joinUrl).toContain('/play/demo?session=');

    // Verify copy button
    await expect(hostPage.getByRole('button', { name: /Copier|Copy/ })).toBeVisible();

    // Verify Démarrer is the only action button (linear flow)
    await expect(hostPage.getByRole('button', { name: /Démarrer/ })).toBeVisible();
    await expect(hostPage.getByRole('button', { name: /Terminer|Suivant|Classement/ })).toBeHidden();
  });

  test('3 - Player joins via join link', async ({ browser }) => {
    // Create a separate browser context for the player (no auth needed)
    playerContext = await browser.newContext();
    playerPage = await playerContext.newPage();

    // Navigate to the join URL
    await playerPage.goto(joinUrl);

    // Verify JoinForm is visible
    await expect(playerPage.getByText('Join the Town')).toBeVisible({ timeout: 15_000 });

    // Fill nickname
    const nicknameInput = playerPage.getByPlaceholder(/pseudo|nickname/i);
    await expect(nicknameInput).toBeVisible({ timeout: 5_000 });
    await nicknameInput.fill('TestPlayer');

    // Select a badge (click the star badge)
    const starBadge = playerPage.getByText('⭐');
    if (await starBadge.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await starBadge.click();
    }

    // Click JOIN
    await playerPage.getByRole('button', { name: 'JOIN' }).click();

    // Verify player enters the waiting room
    await expect(playerPage.getByText(/En attente|Waiting/i)).toBeVisible({ timeout: 10_000 });

    // Verify player count updates on the host side (Citizens stat shows 1)
    // Use a more specific locator to avoid matching other "1" text
    const citizensStat = hostPage.locator('text=Citizens').locator('..');
    await expect(citizensStat).toContainText('1', { timeout: 10_000 });
  });

  test('4 - Host clicks Démarrer -- first question starts with timer', async () => {
    // Click Démarrer on the host page
    await hostPage.getByRole('button', { name: /Démarrer/ }).click();

    // Verify host status changes to "Question en cours"
    await expect(hostPage.getByText('Question en cours')).toBeVisible({ timeout: 10_000 });

    // Verify timer is visible inline on the ControlDeck (shows "sec" label)
    await expect(hostPage.getByText('sec')).toBeVisible({ timeout: 5_000 });

    // Verify question text is displayed on the ControlDeck
    await expect(hostPage.getByRole('heading', { name: QUESTION_TEXT })).toBeVisible({ timeout: 5_000 });

    // Verify answer options with pictograms are displayed on the ControlDeck
    await expect(hostPage.getByText('JavaScript')).toBeVisible({ timeout: 5_000 });
    await expect(hostPage.getByText('Cobol')).toBeVisible({ timeout: 5_000 });
    await expect(hostPage.getByText('Fortran')).toBeVisible({ timeout: 5_000 });
    await expect(hostPage.getByText('Pascal')).toBeVisible({ timeout: 5_000 });

    // Verify tile pictograms are visible on the ControlDeck
    await expect(hostPage.getByText('✕')).toBeVisible({ timeout: 5_000 });
    await expect(hostPage.getByText('○')).toBeVisible({ timeout: 5_000 });
    await expect(hostPage.getByText('△')).toBeVisible({ timeout: 5_000 });
    await expect(hostPage.getByText('□')).toBeVisible({ timeout: 5_000 });

    // Verify only "Afficher les résultats" button is available (linear flow)
    await expect(hostPage.getByRole('button', { name: /Afficher les résultats|Show results/ })).toBeVisible({ timeout: 5_000 });
    await expect(hostPage.getByRole('button', { name: /Suivant|Classement|Terminer/ })).toBeHidden();

    // Verify player sees the question
    await expect(playerPage.getByText(QUESTION_TEXT)).toBeVisible({ timeout: 10_000 });

    // Verify vote tiles are visible on the player side
    await expect(playerPage.getByText('JavaScript')).toBeVisible({ timeout: 5_000 });
    await expect(playerPage.getByText('Cobol')).toBeVisible({ timeout: 5_000 });
  });

  test('5 - Player answers -- auto-advance to leaderboard', async () => {
    // Click on the correct answer (JavaScript)
    await playerPage.getByText('JavaScript').click();

    // Verify vote lock confirmation
    await expect(playerPage.getByText(/Vote verrouillé|Vote locked/i)).toBeVisible({ timeout: 5_000 });

    // All players answered (1/1) → system auto-advances:
    // 1. Auto-reveals results (player sees feedback)
    await expect(playerPage.getByText(/Correct/i)).toBeVisible({ timeout: 15_000 });

    // 2. After ~2s delay, auto-shows leaderboard (no host clicks needed)
    // Host status should reach "Classement" automatically
    await expect(hostPage.getByText('Classement')).toBeVisible({ timeout: 15_000 });

    // Since this is the last (and only) question, "Terminer le quiz" should be shown
    await expect(hostPage.getByRole('button', { name: /Terminer le quiz|Finish quiz/ })).toBeVisible({ timeout: 5_000 });

    // Verify player sees the leaderboard with non-zero XP
    await expect(playerPage.getByText(/TestPlayer/)).toBeVisible({ timeout: 10_000 });
    // Score should be > 0 since the player answered correctly
    await expect(playerPage.getByText(/[1-9]\d*\s*XP/)).toBeVisible({ timeout: 5_000 });

    // Verify host ALSO sees the leaderboard on the ControlDeck with non-zero XP
    await expect(hostPage.getByText(/TestPlayer/)).toBeVisible({ timeout: 10_000 });
    await expect(hostPage.getByText(/[1-9]\d*\s*XP/)).toBeVisible({ timeout: 5_000 });
  });

  test('6 - Host finishes the session from leaderboard', async () => {
    // Click "Terminer le quiz" on host (last question flow)
    await hostPage.getByRole('button', { name: /Terminer le quiz|Finish quiz/ }).click();

    // Verify host shows finished status
    await expect(hostPage.getByText('Terminé')).toBeVisible({ timeout: 10_000 });

    // Verify host shows "Session terminée" message (no action buttons)
    await expect(hostPage.getByText(/Session terminée|Session ended/)).toBeVisible({ timeout: 5_000 });

    // Verify player sees the finished screen
    await expect(playerPage.getByText(/Quiz terminé|Quiz finished/i)).toBeVisible({ timeout: 10_000 });

    // Verify "Rejouer" button does NOT exist on the player side
    await expect(playerPage.getByRole('button', { name: /Rejouer|Play again/ })).toBeHidden();

    // Verify "Retour accueil" button IS available
    await expect(playerPage.getByRole('button', { name: /Retour accueil|Back to home/ })).toBeVisible();
  });

  test('7 - Cleanup: delete the quiz', async () => {
    await hostPage.goto('/host/');
    await expect(hostPage.getByText('Chargement...')).toBeHidden({ timeout: 30_000 });

    const quizHeading = hostPage.getByRole('heading', { name: QUIZ_TITLE });
    await expect(quizHeading).toBeVisible({ timeout: 10_000 });

    hostPage.on('dialog', (dialog) => dialog.accept());
    const deleteBtn = hostPage.getByRole('button', { name: `Supprimer ${QUIZ_TITLE}` });
    await deleteBtn.click();

    await expect(quizHeading).toBeHidden({ timeout: 10_000 });
  });
});
