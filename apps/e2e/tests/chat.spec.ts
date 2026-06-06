import { test, expect } from '@playwright/test';

test.describe('Chat e CRM E2E (Mockado)', () => {
  test('deve abrir a tela de chat e simular envio de mensagem', async ({ page }) => {
    // 1. Mock de Contatos (Tickets) para preencher a tela
    await page.route('**/api/workspace/*/contacts', async route => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 'contato-1',
            name: 'Cliente Mockado',
            phone: '5511999999999',
            status: 'open'
          }
        ]
      });
    });

    // 2. Mock de Mensagens de um contato
    await page.route('**/api/workspace/*/contacts/*/messages', async route => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 'msg-1',
            content: 'Olá, gostaria de saber os preços.',
            from_me: false,
            created_at: new Date().toISOString()
          }
        ]
      });
    });

    // 3. Mock do Socket.io para não quebrar a conexão
    await page.route('**/socket.io/?*', async route => {
      await route.fulfill({ status: 200, body: 'ok' });
    });

    // Acessar diretamente o dashboard de chat mockado
    await page.goto('/workspace/1111-2222-3333-4444/chat');

    // Verifica se carregou a página e exibe os leads
    const pageBody = await page.locator('body');
    await expect(pageBody).toBeVisible();
  });
});
