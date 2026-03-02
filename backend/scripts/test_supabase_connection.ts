import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

async function test() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);

  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.log('ERROR:', error.message);
  } else {
    console.log('SUCCESS - Buckets:', data.map(b => b.name));
  }
}

test();
