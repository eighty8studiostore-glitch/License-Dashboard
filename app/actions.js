'use server';

import fs from 'node:fs';
import path from 'node:path';

export async function uploadUpdate(formData) {
  const file = formData.get('file');
  const version = formData.get('version');
  const signature = formData.get('signature');
  const notes = formData.get('notes');

  if (!file || !version || !signature) {
    return { error: 'Missing fields' };
  }

  try {
    // 1. Prepare Directory
    const uploadDir = path.join(process.cwd(), 'public', 'updates', version);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 2. Write File
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, file.name);
    fs.writeFileSync(filePath, buffer);

    // 3. Update JSON Database
    const dbPath = path.join(process.cwd(), 'data', 'latest.json');
    const newData = {
      version,
      notes,
      pub_date: new Date().toISOString(),
      signatures: { windows: signature }, // Update logic for mac/linux if needed
      filenames: { windows: file.name }
    };
    
    // Ensure data dir exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    fs.writeFileSync(dbPath, JSON.stringify(newData, null, 2));

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
}