import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  // 1. Read the "Database"
  const dbPath = path.join(process.cwd(), 'data', 'latest.json');
  if (!fs.existsSync(dbPath)) {
    return new NextResponse(null, { status: 204 });
  }
  const latestData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // 2. Get client details from URL Query Params (More reliable than headers)
  const { searchParams } = new URL(req.url);
  const currentVersion = searchParams.get('version');
  const target = searchParams.get('target'); // e.g., 'windows-x86_64'
  const arch = searchParams.get('arch');

  // 3. Compare Versions (Simple string comparison, semver is better but this works for exact match)
  if (currentVersion === latestData.version) {
    return new NextResponse(null, { status: 204 }); 
  }

  // 4. Construct URL
  // Ensure NEXT_PUBLIC_SITE_URL is set in your .env (e.g., http://localhost:3000)
  const baseUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/updates/${latestData.version}`;
  
  // 5. Construct Response
  // Tauri v2 expects this specific structure
  const response = {
    version: latestData.version,
    notes: latestData.notes,
    pub_date: latestData.pub_date,
    platforms: {
      // Dynamic key based on the requesting target (e.g., windows-x86_64)
      [target]: {
        signature: latestData.signatures.windows, // Expand logic for mac/linux if needed
        url: `${baseUrl}/${latestData.filenames.windows}` 
      }
    }
  };

  return NextResponse.json(response);
}