import { google, type drive_v3 } from 'googleapis';
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
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

  if (!clientEmail || !privateKey || !parentFolderId) {
    console.warn('[Drive] Missing env vars — skipping Drive integration');
    return null;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  return { drive: google.drive({ version: 'v3', auth }), parentFolderId };
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

    const pdfUpload = await drive.files.create({
      requestBody: {
        name: `${input.filename}.pdf`,
        parents: [clientFolderId],
      },
      media: {
        mimeType: 'application/pdf',
        body: Readable.from(input.pdfBuffer),
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
    console.error('[Drive] Upload failed:', err.message);
    return { success: false, error: err.message };
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
    // google API returns the body typed as `unknown`; it's either the parsed
    // JSON (when the response came through with JSON content-type) or a
    // string that still needs parsing.
    const data = res.data as unknown;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch { return null; }
    }
    return data;
  } catch {
    return null;
  }
}
