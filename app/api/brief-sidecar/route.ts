import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { sanitize } from '@/lib/drive';

export const dynamic = 'force-dynamic';

// Returns the full BriefSchema JSON sidecar for a pipeline row by matching
// the Drive filename convention: FMC-Studios_{briefType}_{company}_{date}_v*.json
//
// Query params: company (required), briefType (required), date (ISO, required)
// The sheet row carries these three; we reconstruct the expected filename
// prefix and look up the most recent matching file in the client folder.

function getDriveClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

  if (clientId && clientSecret && refreshToken && parentFolderId) {
    const oauth2 = new OAuth2Client(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });
    return { drive: google.drive({ version: 'v3', auth: oauth2 }), parentFolderId };
  }

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (clientEmail && privateKey && parentFolderId) {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });
    return { drive: google.drive({ version: 'v3', auth }), parentFolderId };
  }
  return null;
}

function folderName(company: string): string {
  return (company || '').replace(/[<>:"/\\|?*]/g, '').trim() || 'Unknown Client';
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get('company') || '';
  const briefType = searchParams.get('briefType') || '';
  const date = searchParams.get('date') || '';

  if (!company || !briefType || !date) {
    return NextResponse.json({ error: 'Missing company, briefType, or date' }, { status: 400 });
  }

  const config = getDriveClient();
  if (!config) {
    return NextResponse.json({ error: 'Drive not configured' }, { status: 503 });
  }

  try {
    const { drive, parentFolderId } = config;

    const safeFolder = folderName(company);
    const folderQ = `name='${safeFolder.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`;
    const folderRes = await drive.files.list({ q: folderQ, fields: 'files(id, webViewLink)' });
    const folder = folderRes.data.files?.[0];
    const clientFolderId = folder?.id;
    const clientFolderUrl = folder?.webViewLink || null;
    if (!clientFolderId) {
      return NextResponse.json(
        { error: 'Client folder not found in Drive', clientFolderUrl: null },
        { status: 404 }
      );
    }

    const iso = date.includes('T') ? date.split('T')[0] : date.slice(0, 10);
    const prefix = `FMC-Studios_${sanitize(briefType)}_${sanitize(company)}_${iso}`;

    const filesRes = await drive.files.list({
      q: `'${clientFolderId}' in parents and trashed=false and mimeType='application/json'`,
      fields: 'files(id, name, webViewLink, createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 50,
    });

    const match = (filesRes.data.files || []).find(f =>
      (f.name || '').startsWith(prefix) && (f.name || '').endsWith('.json')
    );

    if (!match?.id) {
      return NextResponse.json(
        { error: 'Sidecar JSON not found', clientFolderUrl },
        { status: 404 }
      );
    }

    const fileRes = await drive.files.get({ fileId: match.id, alt: 'media' });
    const data = fileRes.data as unknown;
    let parsed: unknown = data;
    if (typeof data === 'string') {
      try { parsed = JSON.parse(data); } catch { parsed = null; }
    }

    return NextResponse.json({
      data: parsed,
      fileUrl: match.webViewLink || null,
      clientFolderUrl,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[api/brief-sidecar] Lookup failed:', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
