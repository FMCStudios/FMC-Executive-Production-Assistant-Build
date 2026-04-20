import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createBriefPDF } from '@/components/BriefPDF';
import { uploadBriefToDrive } from '@/lib/drive';
import type { BriefSchema } from '@/types/brief-schema';

function sanitize(name: string): string {
  return (name || '')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

function buildBaseFilename(data: BriefSchema, briefTypeName: string): string {
  const briefType = sanitize(briefTypeName);
  const company = sanitize(data.companyName || data.projectName || 'Untitled');
  const date = new Date().toISOString().split('T')[0];
  const version = data.versionHistory?.[data.versionHistory.length - 1]?.version || 1;
  return `FMC-Studios_${briefType}_${company}_${date}_v${version}`;
}

export async function POST(req: Request) {
  try {
    const { data, brandId, brandName, briefTypeName, sctMode } = await req.json();
    const brief = data as BriefSchema;

    const buffer = await renderToBuffer(
      createBriefPDF({ data: brief, brandId, brandName, briefTypeName, sctMode })
    );

    const baseFilename = buildBaseFilename(brief, briefTypeName);
    const filename = `${baseFilename}.pdf`;

    // Fire-and-forget Drive upload — failure must not block the download.
    let driveUrl: string | null = null;
    let driveJsonUrl: string | null = null;
    let driveError: string | null = null;
    try {
      const companyName = brief.companyName || brief.projectName || 'Unknown Client';
      const driveRes = await uploadBriefToDrive({
        pdfBuffer: Buffer.from(buffer),
        jsonData: brief,
        filename: baseFilename,
        companyName,
      });
      if (driveRes.success) {
        driveUrl = driveRes.pdfUrl || null;
        driveJsonUrl = driveRes.jsonUrl || null;
      } else {
        driveError = driveRes.error || 'unknown';
      }
    } catch (driveErr) {
      const err = driveErr instanceof Error ? driveErr : new Error(String(driveErr));
      console.error('[generate-pdf] Drive upload threw (non-fatal):', err.message, err.stack);
      driveError = err.message || 'threw';
    }

    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    if (driveUrl) headers.set('X-Drive-Pdf-Url', driveUrl);
    if (driveJsonUrl) headers.set('X-Drive-Json-Url', driveJsonUrl);
    if (driveError) headers.set('X-Drive-Error', driveError);

    return new NextResponse(new Uint8Array(buffer), { headers });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
