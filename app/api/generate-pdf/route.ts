import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createBriefPDF } from '@/components/BriefPDF';

export async function POST(req: Request) {
  try {
    const { data, brandId, brandName, briefTypeName, sctMode } = await req.json();

    const buffer = await renderToBuffer(
      createBriefPDF({ data, brandId, brandName, briefTypeName, sctMode })
    );

    const slug = brandName.replace(/\s+/g, '-').replace(/&/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${slug}_${briefTypeName.replace(/\s+/g, '-')}_${dateStr}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
