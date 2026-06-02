import { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationCreds, SignalDataTypeMap, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';
import pino from 'pino';

const logger = pino({ name: 'SupabaseAuthState' });

export const useSupabaseAuthState = async (supabase: SupabaseClient, instanceName: string) => {
  const writeData = async (key: string, data: any) => {
    try {
      const rawData = JSON.stringify(data, BufferJSON.replacer);
      const { error } = await supabase.from('whatsapp_sessions').upsert(
        { instance_id: instanceName, key_id: key, data: JSON.parse(rawData) },
        { onConflict: 'instance_id,key_id' }
      );
      if (error) throw error;
    } catch (err) {
      logger.error({ err, key, instanceName }, 'Failed to write auth data to Supabase');
    }
  };

  const readData = async (key: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('data')
        .eq('instance_id', instanceName)
        .eq('key_id', key)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = No rows returned
        logger.error({ error, key, instanceName }, 'Failed to read auth data from Supabase');
        return null;
      }

      if (!data?.data) return null;
      
      // We parse the JSONB dict and revive Buffers
      return JSON.parse(JSON.stringify(data.data), BufferJSON.reviver);
    } catch (err) {
      logger.error({ err, key, instanceName }, 'Error reading auth data from Supabase');
      return null;
    }
  };

  const removeData = async (key: string) => {
    try {
      await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('instance_id', instanceName)
        .eq('key_id', key);
    } catch (err) {
      logger.error({ err, key, instanceName }, 'Failed to remove auth data from Supabase');
    }
  };

  // 1. Fetch existing credentials or initialize new ones
  let creds: AuthenticationCreds;
  const credsData = await readData('creds');
  if (credsData) {
    creds = credsData;
  } else {
    creds = initAuthCreds();
  }

  // 2. Return State object format expected by Baileys
  return {
    state: {
      creds,
      keys: {
        get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
          const data: { [key: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              
              if (type === 'app-state-sync-key' && value) {
                // Fix specific Baileys anomaly for app-state-sync-key which might not use standard revive
                value = typeof value === 'string' ? value : Buffer.from(value.data || value);
              }
              
              if (value) {
                data[id] = value;
              }
            })
          );
          return data as any;
        },
        set: async (data: any) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(key, value));
              } else {
                tasks.push(removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => {
      return writeData('creds', creds);
    }
  };
};
