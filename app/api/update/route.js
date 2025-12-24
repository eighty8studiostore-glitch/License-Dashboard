import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  // 1. Read the "Database" (latest.json)
  const dbPath = path.join(process.cwd(), 'data', 'latest.json');

  if (!fs.existsSync(dbPath)) {
    return new NextResponse(null, { status: 204 }); // No updates configured yet
  }

  const latestData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // 2. Get client details
  const currentVersion = req.headers.get("X-Tauri-Version");
  const platform = req.headers.get("X-Tauri-Platform"); // 'windows', 'linux', 'darwin'
  const arch = req.headers.get("X-Tauri-Arch");

  // 3. Compare Versions
  if (currentVersion === latestData.version) {
    return new NextResponse(null, { status: 204 }); // No content = Up to date
  }

  // 4. Construct Response
  // We assume the file is hosted at /updates/<version>/<filename>
  const baseUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/updates/${latestData.version}`;

  let signature = "";
  let url = "";

  if (platform === "windows") {
    // Return the direct object for the detected platform
    return NextResponse.json({
      version: latestData.version,
      notes: latestData.notes,
      pub_date: latestData.pub_date,
      url: `${baseUrl}/${latestData.filenames.windows}`, // Must point to .zip, not .exe
      signature: latestData.signatures.windows
    });
  } else if (platform === "darwin") {
    // Add mac logic if needed
  }

  if (!url || !signature) {
    return new NextResponse(null, { status: 204 });
  }

  const response = {
    version: latestData.version,
    notes: latestData.notes,
    pub_date: latestData.pub_date,
    platforms: {
      [`${platform}-${arch}`]: {
        signature,
        url
      }
    }
  };

  return NextResponse.json(response);
}