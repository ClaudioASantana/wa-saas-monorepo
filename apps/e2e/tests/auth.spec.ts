import { test, expect } from '@playwright/test';

test.describe('Autenticação E2E (Mockada)', () => {
  test('deve realizar login e redirecionar com sucesso', async ({ page }) => {
    // 1. Interceptar a API de Login do Supabase
    await page.route('**/auth/v1/token?grant_type=password', async route => {
      await route.fulfill({
        status: 200,
        json: {
          access_token: 'mock-jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh',
          user: { id: 'mock-user-123', email: 'admin@mock.com' }
        }
      });
    });

    // 2. Interceptar a chamada de listagem de workspaces para evitar erro na próxima tela
    await page.route('**/rest/v1/workspace_users*', async route => {
      await route.fulfill({
        status: 200,
        json: []
      });
    });

    // Acessar a tela de login
    await page.goto('/login');

    // Garantir que a tela carregou
    await expect(page.locator('text=Entrar')).toBeVisible();

    // Preencher o formulário
    await page.fill('input[type="email"]', 'admin@mock.com');
    await page.fill('input[type="password"]', 'senha123456');
    
    // Submeter
    await page.click('button[type="submit"]');

    // O sistema deve sair da rota /login após o sucesso (podendo ir pra / ou /workspaces)
    await expect(page).not.toHaveURL('/login');
  });
});
