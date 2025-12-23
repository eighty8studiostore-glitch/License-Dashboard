import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pump = promisify(pipeline);

export async function POST(req) {
  const formData = await req.formData();
  
  const file = formData.get('file'); // The .nsis.zip file
  const version = formData.get('version'); // e.g., "0.2.3"
  const signature = formData.get('signature'); // The content of .sig file
  const notes = formData.get('notes') || "Bug fixes";
  
  if (!file || !version || !signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 1. Create Directory: public/updates/v0.2.3/
  const uploadDir = path.join(process.cwd(), 'public', 'updates', version);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 2. Save the File
  const filePath = path.join(uploadDir, file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);

  // 3. Update "Database" (data/latest.json)
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  
  const dbPath = path.join(dbDir, 'latest.json');
  
  const newData = {
    version,
    notes,
    pub_date: new Date().toISOString(),
    signatures: {
      windows: signature, // Expand this object for mac/linux if needed
    },
    filenames: {
      windows: file.name
    }
  };

  fs.writeFileSync(dbPath, JSON.stringify(newData, null, 2));

  return NextResponse.json({ success: true, path: filePath });
}