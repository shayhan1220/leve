import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'libpg-query';

const directories = ['supabase/migrations', 'supabase/tests'];

for (const directory of directories) {
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    await parse(await readFile(join(directory, file), 'utf8'));
  }
}

console.log('SQL syntax parsed successfully.');
