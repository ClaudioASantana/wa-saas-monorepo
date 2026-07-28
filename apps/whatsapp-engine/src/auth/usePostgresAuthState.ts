import { Pool } from 'pg';
import { AuthenticationCreds, SignalDataTypeMap, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';
import pino from 'pino';

const logger = pino({ name: 'PostgresAuthState' });

export const usePostgresAuthState = async (pool: Pool, instanceName: string) => {
  const writeData = async (key: string, data: any) => {
    try {
      const rawData = JSON.stringify(data, BufferJSON.replacer);
      await pool.query(
        `INSERT INTO whatsapp_sessions (instance_id, key_id, data) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (instance_id, key_id) 
         DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [instanceName, key, rawData]
      );
    } catch (err) {
      logger.error({ err, key, instanceName }, 'Failed to write auth data to Postgres');
    }
  };

  const readData = async (key: string) => {
    try {
      const res = await pool.query(
        'SELECT data FROM whatsapp_sessions WHERE instance_id = $1 AND key_id = $2 LIMIT 1',
        [instanceName, key]
      );
        
      if (res.rows.length === 0) {
        return null;
      }

      const data = res.rows[0].data;
      if (!data) return null;
      
      return JSON.parse(typeof data === 'string' ? data : JSON.stringify(data), BufferJSON.reviver);
    } catch (err) {
      logger.error({ err, key, instanceName }, 'Error reading auth data from Postgres');
      return null;
    }
  };

  const removeData = async (key: string) => {
    try {
      await pool.query(
        'DELETE FROM whatsapp_sessions WHERE instance_id = $1 AND key_id = $2',
        [instanceName, key]
      );
    } catch (err) {
      logger.error({ err, key, instanceName }, 'Failed to remove auth data from Postgres');
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
                // Fix specific Baileys anomaly for app-state-sync-key
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
