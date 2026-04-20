import { google, type drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'node:stream';

export type DriveUploadResult = {
  success: boolean;
  pdfFileId?: string;
  jsonFileId?: string;
  pdfUrl?: string;
  jsonUrl?: string;
  folderPath?: string;
  error?: string;
};

function getDriveClient(): { drive: drive_v3.Drive; parentFolderId: string } | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

  // OAuth path — preferred. Files land in the user's personal Drive owned
  // by the authorized account, so storage quota is not an issue.
  if (clientId && clientSecret && refreshToken && parentFolderId) {
    const oauth2Client = new OAuth2Client(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return {
      drive: google.drive({ version: 'v3', auth: oauth2Client }),
      parentFolderId,
    };
  }

  // Fallback: service account JWT. This is kept for Shared Drive setups
  // where the service account can own files. Fails ("service accounts do
  // not have storage quota") for personal Drive folders.
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey && parentFolderId) {
    console.warn(
      '[Drive] OAuth env vars missing — falling back to service account JWT. This will fail for personal Drive folders (quota error). Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN to enable uploads.'
    );
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

  console.warn('[Drive] No auth configured — neither OAuth nor service account env vars are set. Drive uploads disabled.');
  return null;
}

function sanitizeFolderName(name: string): string {
  return (name || '').replace(/[<>:"/\\|?*]/g, '').trim() || 'Unknown Client';
}

async function ensureClientFolder(
  drive: drive_v3.Drive,
  parentFolderId: string,
  companyName: string,
): Promise<string> {
  const safeName = sanitizeFolderName(companyName);
  const q = `name='${safeName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`;
  const res = await drive.files.list({ q, fields: 'files(id, name)' });
  const existing = res.data.files?.[0]?.id;
  if (existing) return existing;

  const folder = await drive.files.create({
    requestBody: {
      name: safeName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  });
  if (!folder.data.id) throw new Error('Failed to create client folder');
  return folder.data.id;
}

export async function uploadBriefToDrive(input: {
  pdfBuffer: Buffer;
  jsonData: object;
  filename: string; // base filename without extension
  companyName: string;
}): Promise<DriveUploadResult> {
  const config = getDriveClient();
  if (!config) return { success: false, error: 'Drive not configured' };

  try {
    const { drive, parentFolderId } = config;
    const clientFolderId = await ensureClientFolder(drive, parentFolderId, input.companyName);

    const pdfBuffer = Buffer.isBuffer(input.pdfBuffer) ? input.pdfBuffer : Buffer.from(input.pdfBuffer);

    const pdfUpload = await drive.files.create({
      requestBody: {
        name: `${input.filename}.pdf`,
        parents: [clientFolderId],
      },
      media: {
        mimeType: 'application/pdf',
        body: Readable.from(pdfBuffer),
      },
      fields: 'id, webViewLink',
    });

    const jsonBuffer = Buffer.from(JSON.stringify(input.jsonData, null, 2));
    const jsonUpload = await drive.files.create({
      requestBody: {
        name: `${input.filename}.json`,
        parents: [clientFolderId],
      },
      media: {
        mimeType: 'application/json',
        body: Readable.from(jsonBuffer),
      },
      fields: 'id, webViewLink',
    });

    return {
      success: true,
      pdfFileId: pdfUpload.data.id || undefined,
      jsonFileId: jsonUpload.data.id || undefined,
      pdfUrl: pdfUpload.data.webViewLink || undefined,
      jsonUrl: jsonUpload.data.webViewLink || undefined,
      folderPath: `FMC-EPA-Briefs/${sanitizeFolderName(input.companyName)}/`,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(
      '[Drive] Upload failed:',
      err.message,
      err.stack,
      JSON.stringify(err, Object.getOwnPropertyNames(err))
    );
    return { success: false, error: err.message || 'Unknown Drive error' };
  }
}

export async function listClientBriefs(companyName: string): Promise<Array<{
  id: string;
  name: string;
  url: string;
  createdTime: string;
}>> {
  const config = getDriveClient();
  if (!config) return [];

  try {
    const { drive, parentFolderId } = config;
    const safeName = sanitizeFolderName(companyName);

    const folderQ = `name='${safeName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`;
    const folderRes = await drive.files.list({ q: folderQ, fields: 'files(id)' });
    const clientFolderId = folderRes.data.files?.[0]?.id;
    if (!clientFolderId) return [];

    const filesRes = await drive.files.list({
      q: `'${clientFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink, createdTime)',
      orderBy: 'createdTime desc',
    });

    return (filesRes.data.files || []).map(f => ({
      id: f.id || '',
      name: f.name || '',
      url: f.webViewLink || '',
      createdTime: f.createdTime || '',
    }));
  } catch {
    return [];
  }
}

export async function fetchSidecarJson(fileId: string): Promise<unknown> {
  const config = getDriveClient();
  if (!config) return null;
  try {
    const res = await config.drive.files.get({ fileId, alt: 'media' });
    const data = res.data as unknown;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch { return null; }
    }
    return data;
  } catch {
    return null;
  }
}
