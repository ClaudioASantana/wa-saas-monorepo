const fs = require('fs');
const path = 'e:/repos/ClaudioASantana/whatsapp-crm-saas/wa-saas-monorepo/docs/superpowers/plans/2026-03-12-contacts-page.md';
let c = fs.readFileSync(path, 'utf8');

// Find Task 2 start and end by index
const task2Start = c.indexOf('### Task 2: Endpoint');
const task2End = c.indexOf('\n---\n\n## Chunk 2:');

if (task2Start === -1 || task2End === -1) {
  console.log('MARKERS NOT FOUND. task2Start:', task2Start, 'task2End:', task2End);
  process.exit(1);
}

const task2New = `### Task 2: Endpoint \`PATCH /api/workspace/[id]/contacts/[contactId]\`

**Files:**
- Create: \`apps/web/server/api/workspace/[id]/contacts/[contactId].patch.ts\`

Segue o padrão de \`/api/workspace/[id]/quick-replies/\`. O \`workspaceId\` vem da URL — não do body — consistente com todos os outros endpoints. O filtro \`.eq('workspace_id', workspaceId)\` + RLS do Supabase é suficiente para ownership sem membership check explícito.

- [ ] **Step 1: Criar o endpoint**

\`\`\`typescript
// apps/web/server/api/workspace/[id]/contacts/[contactId].patch.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const contactSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().min(1).max(50).optional(),
    notes: z.string().max(5000).optional(),
    is_active: z.boolean().optional(),
    // metadata is intentionally excluded — managed by the webhook/ingestion pipeline
  })
  .refine(
    (obj) => Object.values(obj).some((v) => v !== undefined),
    { message: 'At least one field to update is required' }
  )

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { id: workspaceId, contactId } = event.context.params || {}
  if (!workspaceId || !contactId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Contact ID are required' })
  }

  // Validate contactId is a valid UUID to avoid Postgres 500 on malformed input
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contactId)) {
    throw createError({ statusCode: 400, message: 'Invalid Contact ID format' })
  }

  const body = await readBody(event)
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0]?.message ?? 'Invalid request body' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('contacts')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('workspace_id', workspaceId) // ownership: workspaceId from URL + Supabase RLS
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'Este telefone já existe neste workspace' })
    }
    throw createError({ statusCode: 500, message: error.message })
  }
  if (!data) {
    throw createError({ statusCode: 404, message: 'Contact not found or access denied' })
  }

  return data
})
\`\`\`

> **Segurança:** \`workspaceId\` vem da URL (não do body). Filtro \`.eq('workspace_id', workspaceId)\` + RLS do Supabase garante ownership. \`contactId\` é validado como UUID para evitar erros 500 do Postgres.

- [ ] **Step 2: Verificar que o TypeScript compila**

\`\`\`bash
cd apps/web
npm run typecheck
\`\`\`

Saída esperada: sem erros de tipo.

- [ ] **Step 3: Commit**

\`\`\`bash
git add "apps/web/server/api/workspace/[id]/contacts/[contactId].patch.ts"
git commit -m "feat(api): cria endpoint PATCH /api/workspace/[id]/contacts/[contactId] [Story 1.4]"
\`\`\``;

c = c.substring(0, task2Start) + task2New + c.substring(task2End);

// Also fix Migration section
// Fix db push --local
c = c.replace(
  'npx supabase db push\n```\n\nSaída esperada: `Applying migration 20260312000001_add_contact_status.sql... done`',
  'npx supabase db push --local\n```\n\n> Para produção: use sem `--local` após validar localmente.\n\nSaída esperada: `Applying migration 20260312000001_add_contact_status.sql... done`'
);

// Fix migration verification
c = c.replace(
  '- [ ] **Step 3: Verificar que a coluna existe**\n\n```bash\nnpx supabase db diff\n```\n\nSaída esperada: nenhuma diferença pendente.',
  '- [ ] **Step 3: Verificar que a migration foi aplicada**\n\n```bash\nnpx supabase migration list\n```\n\nSaída esperada: `20260312000001_add_contact_status` com status `Applied`.'
);

// Add RLS check step before commit
c = c.replace(
  '- [ ] **Step 4: Commit**\n\n```bash\ngit add supabase/migrations/20260312000001_add_contact_status.sql',
  '- [ ] **Step 4: Verificar RLS existente na tabela contacts**\n\nNo Supabase dashboard → Authentication → Policies → tabela `contacts`. Confirme que as políticas existentes não precisam ser alteradas. Para esta story, `is_active` é apenas um campo editável, não um filtro de acesso — policies existentes permanecem válidas.\n\n- [ ] **Step 5: Commit**\n\n```bash\ngit add supabase/migrations/20260312000001_add_contact_status.sql'
);

// Fix ContactModal fetch URL
c = c.replace(
  '    const updated = await $fetch<ContactRow>(`/api/contacts/${props.contact.id}`, {',
  '    const updated = await $fetch<ContactRow>(`/api/workspace/${workspaceId}/contacts/${props.contact.id}`, {'
);

// Remove workspace_id from ContactModal body if present
c = c.replace(
  '        workspace_id: workspaceId, // required for server-side ownership check\n        name: form.name || undefined,',
  '        name: form.name || undefined,'
);

// Fix file summary table
c = c.replace(
  '| `apps/web/server/api/contacts/[id].patch.ts` | Criar |',
  '| `apps/web/server/api/workspace/[id]/contacts/[contactId].patch.ts` | Criar |'
);

fs.writeFileSync(path, c, 'utf8');
console.log('Done. Verifying...');
const result = fs.readFileSync(path, 'utf8');
console.log('New endpoint header:', result.includes('PATCH /api/workspace/[id]/contacts/[contactId]'));
console.log('workspaceId from URL:', result.includes('const { id: workspaceId, contactId }'));
console.log('UUID validation:', result.includes('Invalid Contact ID format'));
console.log('safeParse:', result.includes('contactSchema.safeParse'));
console.log('constraint 409:', result.includes("error.code === '23505'"));
console.log('RLS step:', result.includes('Verificar RLS'));
console.log('migration list:', result.includes('migration list'));
console.log('--local flag:', result.includes('--local'));
console.log('ContactModal new URL:', result.includes('/api/workspace/${workspaceId}/contacts/'));
console.log('Summary table updated:', result.includes('workspace/[id]/contacts/[contactId].patch.ts'));
