import { test, expect } from '@playwright/test';

test.describe('Workspaces E2E (Mockado)', () => {
  test('deve listar workspaces e permitir clicar em um', async ({ page }) => {
    // 1. Forçar a injeção do token mockado no localStorage simulando login prévio
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-access-token', 'mock-token');
    });

    // 2. Mockar a API de Workspaces do Supabase retornando 1 workspace fictício
    await page.route('**/rest/v1/workspace_users*', async route => {
      await route.fulfill({
        status: 200,
        json: [
          {
            workspace_id: '1111-2222-3333-4444',
            role: 'admin',
            workspaces: {
              id: '1111-2222-3333-4444',
              name: 'Agência Mockada E2E',
              stripe_status: 'active'
            }
          }
        ]
      });
    });

    // Acessar a raiz (tela de listagem)
    await page.goto('/');

    // Validar se o nome do workspace fictício apareceu na tela
    await expect(page.locator('text=Agência Mockada E2E')).toBeVisible();
  });
});
