'use client';

import type { BriefSchema, SCTMode } from '@/types/brief-schema';

// ── Brand theme definitions ───────────────────────────────────

type BrandTheme = {
  bg: string;
  text: string;
  textMuted: string;
  accent: string;
  secondary: string;
  tertiary?: string;
  cardBg: string;
  cardBorder: string;
  gapsBg: string;
  noteBg: string;
  noteBorder: string;
  logoSrc: string | null;
  logoHeight: number;
  brandLabel: string;
  displayFont: string;
  bodyFont: string;
  footerTagline: string;
  footerTaglineFont?: string;
  titleTransform: string;
  titleSpacing: string;
  titleSize: string;
  bodyLineHeight: string;
  labelProspect: string;
  labelGaps: string;
};

const themes: Record<string, BrandTheme> = {
  fmc: {
    bg: '#0D0D0D',
    text: '#F0EBE1',
    textMuted: '#888880',
    accent: '#E03413',
    secondary: '#B45F34',
    cardBg: 'rgba(240,235,225,0.03)',
    cardBorder: 'rgba(240,235,225,0.18)',
    gapsBg: 'rgba(224,52,19,0.06)',
    noteBg: 'rgba(73,121,123,0.08)',
    noteBorder: '#49797B',
    logoSrc: '/logos/fmc-cube.png',
    logoHeight: 32,
    brandLabel: 'FERGUSON MEDIA COLLECTIVE',
    displayFont: '"Avenir Next", "Avenir", -apple-system, sans-serif',
    bodyFont: '"Avenir Next", "Avenir", -apple-system, sans-serif',
    footerTagline: 'Together We Win',
    titleTransform: 'uppercase',
    titleSpacing: '0.03em',
    titleSize: '32px',
    bodyLineHeight: '1.65',
    labelProspect: 'Prospect',
    labelGaps: 'Gaps \u2014 Critical Unknowns',
  },
  tourbus: {
    bg: '#F5F0E8',
    text: '#1A1A1A',
    textMuted: '#4A4A4A',
    accent: '#D42B2B',
    secondary: '#C41E3A',
    cardBg: 'rgba(26,26,26,0.04)',
    cardBorder: 'rgba(26,26,26,0.12)',
    gapsBg: 'rgba(212,43,43,0.06)',
    noteBg: 'rgba(212,43,43,0.04)',
    noteBorder: '#C41E3A',
    logoSrc: '/logos/tbe-badge.png',
    logoHeight: 40,
    brandLabel: 'TOUR BUS ENTERTAINMENT',
    displayFont: '"Panton Rust", "Avenir Next", sans-serif',
    bodyFont: '"Roboto", "Avenir Next", -apple-system, sans-serif',
    footerTagline: 'Taking You Beyond the Stage...',
    titleTransform: 'uppercase',
    titleSpacing: '0.03em',
    titleSize: '32px',
    bodyLineHeight: '1.65',
    labelProspect: 'Prospect',
    labelGaps: 'Gaps \u2014 Critical Unknowns',
  },
  oakandcider: {
    bg: '#FAF6F0',
    text: '#2A2A2A',
    textMuted: '#5A5A5A',
    accent: '#C4842D',
    secondary: '#8B6914',
    tertiary: '#7A8B6F',
    cardBg: 'rgba(42,42,42,0.025)',
    cardBorder: 'rgba(42,42,42,0.1)',
    gapsBg: 'rgba(196,132,45,0.06)',
    noteBg: 'rgba(122,139,111,0.08)',
    noteBorder: '#7A8B6F',
    logoSrc: null,
    logoHeight: 0,
    brandLabel: 'STUDIOS',
    displayFont: '"Shelten", "Playfair Display", Georgia, serif',
    bodyFont: '"Ovo", "Lora", Georgia, serif',
    footerTagline: 'Bespoke Wedding Documentary',
    footerTaglineFont: '"Shelten", "Playfair Display", Georgia, serif',
    titleTransform: 'none',
    titleSpacing: '-0.01em',
    titleSize: '30px',
    bodyLineHeight: '1.75',
    labelProspect: 'The Couple',
    labelGaps: 'Still Needed',
  },
};

function getTheme(brandId: string): BrandTheme {
  return themes[brandId] || themes.fmc;
}

// ── Helpers ───────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function addAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgba')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function sectionLabel(label: string, t: BrandTheme): string {
  return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
    <span style="font-family:${t.displayFont};font-size:10px;font-weight:700;letter-spacing:${t.titleTransform === 'none' ? '0.05em' : '0.14em'};text-transform:${t.titleTransform};color:${t.accent};white-space:nowrap">${escapeHtml(label)}</span>
    <div style="flex:1;height:1px;background:${t.cardBorder}"></div>
  </div>`;
}

function severityColor(severity: string | undefined, t: BrandTheme): string {
  if (severity === 'critical') return t.accent;
  if (severity === 'moderate') return t.secondary;
  return t.tertiary || t.textMuted;
}

// ── Main template builder ─────────────────────────────────────

export type PDFTemplateProps = {
  data: BriefSchema;
  brandId: string;
  brandName: string;
  briefTypeName: string;
  sctMode: SCTMode;
};

export function buildPDFHTML(props: PDFTemplateProps): string {
  const { data, brandId, brandName, briefTypeName, sctMode } = props;
  const t = getTheme(brandId);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isOC = brandId === 'oakandcider';

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Panton Rust'; src: url('/fonts/PantonRustHeavy-GrSh.woff2') format('woff2'); font-weight: 800; font-style: normal; }
@font-face { font-family: 'Roboto'; src: url('/fonts/Roboto-Medium.ttf') format('truetype'); font-weight: 500; font-style: normal; }
@font-face { font-family: 'Shelten'; src: url('/fonts/Shelten.ttf') format('truetype'); font-weight: 400; font-style: normal; }
@font-face { font-family: 'Ovo'; src: url('/fonts/Ovo-Regular.ttf') format('truetype'); font-weight: 400; font-style: normal; }
* { margin: 0; padding: 0; box-sizing: border-box; }
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
}
</style></head>
<body style="width:816px;min-height:1056px;display:flex;flex-direction:column;background:${t.bg};color:${t.text};font-family:${t.bodyFont};margin:0;padding:0">
<div style="flex:1;padding:48px 48px 0">
`;

  // ── Header ──────────────────────────────────────────────────

  html += `<div style="margin-bottom:28px">`;

  // Logo row
  html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">`;
  html += `<div style="display:flex;align-items:center;gap:10px">`;
  if (t.logoSrc) {
    html += `<img src="${t.logoSrc}" style="display:block;height:${t.logoHeight}px;width:auto" crossorigin="anonymous" />`;
    html += `<span style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:${t.textMuted}">${escapeHtml(t.brandLabel)}</span>`;
  } else {
    html += `<div style="display:flex;flex-direction:column;line-height:1">
      <span style="font-family:${t.displayFont};font-size:18px;color:${t.accent}">Oak &amp; Cider</span>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${t.textMuted};margin-top:2px">${escapeHtml(t.brandLabel)}</span>
    </div>`;
  }
  html += `</div>`;

  // Badge pills
  html += `<div style="display:flex;gap:8px">`;
  html += `<span style="font-size:10px;font-weight:600;padding:4px 12px;border-radius:20px;background:${addAlpha(t.accent, 0.1)};border:1px solid ${addAlpha(t.accent, 0.25)};color:${t.accent}">${escapeHtml(briefTypeName)}</span>`;
  html += `</div></div>`;

  // Eyebrow + Title
  html += `<div style="font-family:${t.displayFont};font-size:10px;font-weight:700;letter-spacing:${t.titleTransform === 'none' ? '0.05em' : '0.14em'};text-transform:${t.titleTransform};color:${t.accent};margin-bottom:8px">BRIEF</div>`;
  const titleTransform = isOC ? 'none' : 'uppercase';
  const displayName = isOC ? data.projectName : data.projectName.toUpperCase();
  html += `<div style="font-family:${t.displayFont};font-size:${t.titleSize};font-weight:800;letter-spacing:${t.titleSpacing};color:${t.text};margin-bottom:6px">${escapeHtml(displayName)}</div>`;

  // Subtitle
  if (data.projectDescription) {
    const subStyle = isOC ? 'font-style:italic;' : '';
    html += `<div style="font-size:13px;color:${t.textMuted};${subStyle}margin-bottom:14px">${escapeHtml(data.projectDescription)}</div>`;
  }

  // Meta line
  html += `<div style="display:flex;gap:16px;font-size:10px;color:${t.textMuted};margin-bottom:18px">`;
  html += `<span>${escapeHtml(brandName)}</span><span>\u00B7</span><span>${escapeHtml(date)}</span>`;
  html += `</div>`;

  // Separator
  html += `<div style="height:1px;background:${addAlpha(t.accent, 0.3)}"></div>`;
  html += `</div>`;

  // ── Context grid ────────────────────────────────────────────

  if (data.context.length > 0) {
    html += `<div style="margin-bottom:24px">`;
    html += sectionLabel(t.labelProspect, t);
    const cols = Math.min(data.context.length, 3);
    html += `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px">`;
    for (const kv of data.context) {
      html += `<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:8px;padding:10px 14px">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:${t.titleTransform};color:${t.accent};margin-bottom:4px">${escapeHtml(kv.label)}</div>
        <div style="font-size:13px;font-weight:500;color:${t.text}">${escapeHtml(kv.value)}</div>
      </div>`;
    }
    html += `</div></div>`;
  }

  // ── Content sections ────────────────────────────────────────

  for (const section of data.sections) {
    html += `<div style="margin-bottom:20px">`;
    html += sectionLabel(section.header, t);
    html += `<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:10px;padding:16px 20px">`;

    if (section.body) {
      const lines = section.body.split('\n').filter(l => l.trim());
      for (const line of lines) {
        html += `<p style="font-size:13px;color:${addAlpha(t.text, 0.75)};line-height:${t.bodyLineHeight};margin:3px 0">${escapeHtml(line)}</p>`;
      }
    }

    if (section.items && section.items.length > 0) {
      for (const item of section.items) {
        html += `<div style="display:flex;gap:6px;align-items:flex-start;padding:2px 0">
          <span style="color:${t.secondary};margin-top:2px;flex-shrink:0">\u00B7</span>
          <span style="font-size:13px;color:${addAlpha(t.text, 0.75)};line-height:${t.bodyLineHeight}">${escapeHtml(item)}</span>
        </div>`;
      }
    }

    if (section.keyValues && section.keyValues.length > 0) {
      const kvCols = Math.min(section.keyValues.length, 3);
      html += `<div style="display:grid;grid-template-columns:repeat(${kvCols},1fr);gap:10px">`;
      for (const kv of section.keyValues) {
        html += `<div style="background:${addAlpha(t.text, 0.02)};border-radius:6px;padding:8px 12px">
          <div style="font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:${t.titleTransform};color:${t.accent};margin-bottom:3px">${escapeHtml(kv.label)}</div>
          <div style="font-size:13px;color:${t.text}">${escapeHtml(kv.value)}</div>
        </div>`;
      }
      html += `</div>`;
    }

    if (section.checklist && section.checklist.length > 0) {
      for (const item of section.checklist) {
        const check = item.checked ? '\u2713' : '\u25A1';
        const checkColor = item.checked ? (t.tertiary || t.secondary) : t.textMuted;
        html += `<div style="display:flex;gap:8px;align-items:flex-start;padding:3px 0">
          <span style="color:${checkColor};font-size:14px;flex-shrink:0;line-height:1.2">${check}</span>
          <span style="font-size:13px;color:${addAlpha(t.text, 0.75)};line-height:${t.bodyLineHeight}">${escapeHtml(item.label)}</span>
        </div>`;
      }
    }

    html += `</div></div>`;
  }

  // ── SCT sections ────────────────────────────────────────────

  if (data.sctPrimary && sctMode !== 'none') {
    html += renderSCTGroup(data.sctPrimary.groupLabel, data.sctPrimary.blocks, t);
  }
  if (data.sctSecondary && sctMode === 'dual') {
    html += renderSCTGroup(data.sctSecondary.groupLabel, data.sctSecondary.blocks, t);
  }

  // ── Strategic note ──────────────────────────────────────────

  if (data.strategicNote) {
    html += `<div style="margin-top:24px;padding:16px 20px;background:${t.noteBg};border-left:3px solid ${t.noteBorder};border-radius:0 8px 8px 0">`;
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:${t.titleTransform === 'none' ? '0.05em' : '0.12em'};text-transform:${t.titleTransform};color:${t.noteBorder};margin-bottom:8px">${isOC ? 'Note' : 'STRATEGIC NOTE'}</div>`;
    html += `<p style="font-size:13px;color:${addAlpha(t.text, 0.75)};line-height:${t.bodyLineHeight}">${escapeHtml(data.strategicNote)}</p>`;
    html += `</div>`;
  }

  // ── Gaps ────────────────────────────────────────────────────

  if (data.gaps.length > 0) {
    html += `<div style="margin-top:24px;padding:16px 20px;background:${t.gapsBg};border-left:4px solid ${t.accent};border-radius:0 8px 8px 0">`;
    html += `<div style="font-family:${t.displayFont};font-size:10px;font-weight:700;letter-spacing:${t.titleTransform === 'none' ? '0.05em' : '0.14em'};text-transform:${t.titleTransform};color:${t.accent};margin-bottom:12px">${escapeHtml(t.labelGaps)}</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 24px">`;
    for (const gap of data.gaps) {
      const dotColor = severityColor(gap.severity, t);
      html += `<div style="display:flex;gap:6px;align-items:flex-start">
        <span style="color:${dotColor};font-size:8px;margin-top:4px;flex-shrink:0">\u25CF</span>
        <span style="font-size:13px;color:${t.text};line-height:${t.bodyLineHeight}">${escapeHtml(gap.text)}</span>
      </div>`;
    }
    html += `</div></div>`;
  }

  // ── Next steps ──────────────────────────────────────────────

  if (data.nextSteps.length > 0) {
    html += `<div style="margin-top:24px">`;
    html += sectionLabel('Next Steps', t);

    // Group by owner
    const groups = new Map<string, typeof data.nextSteps>();
    for (const step of data.nextSteps) {
      const owner = step.owner || 'General';
      if (!groups.has(owner)) groups.set(owner, []);
      groups.get(owner)!.push(step);
    }

    // Render GENERAL last
    const orderedKeys = Array.from(groups.keys()).filter(k => k !== 'General');
    if (groups.has('General')) orderedKeys.push('General');

    for (const owner of orderedKeys) {
      const actions = groups.get(owner)!;
      html += `<div style="margin-bottom:14px">`;
      html += `<div style="font-family:${t.displayFont};font-size:10px;font-weight:700;letter-spacing:${t.titleTransform === 'none' ? '0.05em' : '0.12em'};text-transform:${t.titleTransform};color:${t.accent};margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid ${addAlpha(t.accent, 0.15)}">${escapeHtml(owner)}</div>`;
      html += `<div style="border-left:2px solid ${t.secondary};padding-left:14px">`;
      for (const action of actions) {
        html += `<div style="display:flex;align-items:baseline;gap:8px;padding:3px 0">`;
        html += `<span style="color:${addAlpha(t.accent, 0.4)};flex-shrink:0;font-size:12px">\u2192</span>`;
        html += `<span style="font-size:13px;color:${addAlpha(t.text, 0.75)};line-height:${t.bodyLineHeight}">${escapeHtml(action.action)}</span>`;
        if (action.deadline) {
          const pillColor = t.tertiary || t.secondary;
          html += `<span style="font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px;background:${addAlpha(pillColor, 0.12)};color:${pillColor};white-space:nowrap">${escapeHtml(action.deadline)}</span>`;
        }
        html += `</div>`;
      }
      html += `</div></div>`;
    }
    html += `</div>`;
  }

  // Close content div
  html += `</div>`;

  // ── Footer ──────────────────────────────────────────────────

  html += `<div style="padding:0 48px 40px">`;
  html += `<div style="padding-top:16px;border-top:1px solid ${t.cardBorder};display:flex;justify-content:space-between;align-items:center">`;
  html += `<span style="font-size:10px;color:${t.textMuted}">Generated by EPA \u00B7 ${escapeHtml(brandName)} \u00B7 ${escapeHtml(date)}</span>`;
  const tagFont = t.footerTaglineFont || t.bodyFont;
  const tagTransform = t.footerTaglineFont ? 'none' : 'uppercase';
  const tagItalic = t.footerTaglineFont ? 'font-style:italic;' : '';
  html += `<span style="font-family:${tagFont};font-size:10px;font-weight:700;text-transform:${tagTransform};${tagItalic}color:${t.accent}">${escapeHtml(t.footerTagline)}</span>`;
  html += `</div></div>`;

  html += `</body></html>`;
  return html;
}

// ── SCT group renderer ────────────────────────────────────────

function renderSCTGroup(groupLabel: string, blocks: { label: string; content: string }[], t: BrandTheme): string {
  let html = `<div style="margin-top:24px">`;
  html += sectionLabel(groupLabel, t);
  html += `<div style="display:flex;gap:12px">`;

  for (const block of blocks) {
    html += `<div style="flex:1;border-left:3px solid ${t.accent};background:${t.cardBg};border-radius:0 8px 8px 0;padding:14px 16px 14px 18px">`;
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:${t.titleTransform === 'none' ? '0.05em' : '0.12em'};text-transform:${t.titleTransform};color:${t.accent};margin-bottom:8px">${escapeHtml(block.label)}</div>`;
    // Render content paragraphs
    const lines = block.content.split('\n').filter(l => l.trim());
    for (const line of lines) {
      html += `<p style="font-size:12px;color:${addAlpha(t.text, 0.75)};line-height:${t.bodyLineHeight};margin:2px 0">${escapeHtml(line)}</p>`;
    }
    html += `</div>`;
  }

  html += `</div></div>`;
  return html;
}
