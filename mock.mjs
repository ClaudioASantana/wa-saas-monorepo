import { createClient } from '@supabase/supabase-js';

const supabase = createClient("http://127.0.0.1:54321", "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz");

async function run() {
  console.log("Creating Tenant...");
  const { data: tenant, error: tErr } = await supabase.from('tenants').insert({
    name: 'Mock Tenant'
  }).select().single();
  
  if (tErr) console.error("Tenant error:", tErr);
  const tenantId = tenant ? tenant.id : undefined;

  console.log("Creating Workspace...");
  const { data: workspace, error: wErr } = await supabase.from('workspaces').insert({
    tenant_id: tenantId,
    name: 'Mock Workspace'
  }).select().single();

  if (wErr) console.error("Workspace error:", wErr);
  const workspaceId = workspace ? workspace.id : undefined;

  console.log("Creating Channel...");
  const { data: channel, error: cErr } = await supabase.from('channels').insert({
    workspace_id: workspaceId,
    name: 'Mock WhatsApp Channel',
    provider: 'evolution',
    provider_instance_id: 'primary-instance',
    status: 'connected'
  }).select().single();

  if (cErr) console.error("Channel error:", cErr);

  console.log("Mock data inserted!");
  console.log("Tenant:", tenantId);
  console.log("Workspace:", workspaceId);
  console.log("Channel ID:", channel?.id);
}

run();
