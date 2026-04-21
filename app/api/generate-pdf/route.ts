import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createBriefPDF } from '@/components/BriefPDF';
import { uploadBriefToDrive, buildBaseFilename } from '@/lib/drive';
import type { BriefSchema } from '@/types/brief-schema';

type DriveStatus = 'uploaded' | 'failed' | 'disabled';

export async function POST(req: Request) {
  try {
    const { data, brandId, brandName, briefTypeName, sctMode } = await req.json();
    const brief = data as BriefSchema;

    const buffer = await renderToBuffer(
      createBriefPDF({ data: brief, brandId, brandName, briefTypeName, sctMode })
    );

    const baseFilename = buildBaseFilename(brief, briefTypeName);
    const filename = `${baseFilename}.pdf`;

    // Fire-and-forget Drive upload — failure must never block the PDF.
    let driveStatus: DriveStatus = 'disabled';
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
        driveStatus = 'uploaded';
        driveUrl = driveRes.pdfUrl || null;
        driveJsonUrl = driveRes.jsonUrl || null;
      } else {
        // Distinguish "not configured" from actual errors so the client
        // can tell why the upload didn't land.
        const err = driveRes.error || 'unknown';
        const normalized = err.toLowerCase();
        if (normalized.includes('not configured')) {
          driveStatus = 'disabled';
        } else {
          driveStatus = 'failed';
          driveError = err;
        }
      }
    } catch (driveErr) {
      const err = driveErr instanceof Error ? driveErr : new Error(String(driveErr));
      console.error('[generate-pdf] Drive upload threw (non-fatal):', err.message, err.stack);
      driveStatus = 'failed';
      driveError = err.message || 'threw';
    }

    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Drive-Status': driveStatus,
    });
    if (driveUrl) headers.set('X-Drive-Url', driveUrl);
    if (driveJsonUrl) headers.set('X-Drive-Json-Url', driveJsonUrl);
    if (driveError) headers.set('X-Drive-Error', driveError);

    return new NextResponse(new Uint8Array(buffer), { headers });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
