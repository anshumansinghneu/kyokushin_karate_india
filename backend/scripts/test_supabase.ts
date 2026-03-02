import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

async function test() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);

  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('ERROR:', error.message);
    } else {
      console.log('SUCCESS - Buckets:', JSON.stringify(data.map(b => b.name)));
    }
  } catch (e: any) {
    console.log('CATCH ERROR:', e.message);
  }
}

test();
