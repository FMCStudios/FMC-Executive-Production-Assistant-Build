'use client';

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
  gapsBorder: string;
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
  // Language overrides for O&C
  labelProspect: string;
  labelClientNarrative: string;
  labelGaps: string;
  labelNote: string;
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
    gapsBg: 'rgba(180,95,52,0.08)',
    gapsBorder: '#B45F34',
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
    labelClientNarrative: 'Client Narrative',
    labelGaps: 'Gaps \u2014 Critical Unknowns',
    labelNote: 'Strategic Note',
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
    gapsBorder: '#D42B2B',
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
    labelClientNarrative: 'Client Narrative',
    labelGaps: 'Gaps \u2014 Critical Unknowns',
    labelNote: 'Strategic Note',
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
    gapsBorder: '#C4842D',
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
    labelClientNarrative: 'Their Story',
    labelGaps: 'Still Needed',
    labelNote: 'Note',
  },
};

function getTheme(brandId: string): BrandTheme {
  return themes[brandId] || themes.fmc;
}

// ── Section parsing (mirrors BriefOutput) ─────────────────────

type ParsedSection = { header: string; content: string };

/** Strip all markdown formatting so parsers see plain text */
function normalizeBrief(text: string): string {
  return text
    .replace(/^#{1,4}\s+(.+?)\s*$/gm, (_, h) => {
      const upper = h.replace(/\*{2}/g, '').replace(/:\s*$/, '').trim();
      return upper.toUpperCase() === upper ? `${upper}:` : h;
    })
    .replace(/^\*{2}([A-Z][A-Z\s&\/()\u2014-]+?)\*{2}:?\s*$/gm, '$1:')
    .replace(/\*{2}([^*]+?)\*{2}/g, '$1')
    .replace(/__([^_]+?)__/g, '$1')
    .replace(/(?<=\S)\*([^*\n]+?)\*(?=\S|[.,;:!?])/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n');
}

function parseSections(brief: string): ParsedSection[] {
  const normalized = normalizeBrief(brief);
  const parts = normalized.split(/\n(?=[A-Z][A-Z\s&\/()\u2014-]+:)/g);
  return parts
    .map((part) => {
      const m = part.match(/^([A-Z][A-Z\s&\/()\u2014-]+):([\s\S]*)/);
      return m ? { header: m[1].trim(), content: m[2].trim() } : null;
    })
    .filter((s): s is ParsedSection => s !== null && s.content.length > 0);
}

// ── Next steps grouped by person ──────────────────────────────

type GroupedSteps = { owner: string; actions: { text: string; deadline: string | null }[] };

function groupNextSteps(content: string): GroupedSteps[] {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const groups: Map<string, { text: string; deadline: string | null }[]> = new Map();

  const ownerPatterns = [
    /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*(?:to|should|will|needs to)\s+(.+)$/,
    /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?):\s+(.+)$/,
    /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*[-\u2014]\s+(.+)$/,
  ];

  const dateRe = /\b(within\s+\d+\s+(?:hours?|days?|weeks?)|(?:this|next)\s+(?:week|month)|by\s+(?:end\s+of\s+)?\w+(?:\s+\d+)?(?:,?\s+\d{4})?|Q[1-4]\s+\d{4}|\d+\s+(?:hours?|days?|weeks?))\b/i;

  for (const raw of lines) {
    const line = raw.replace(/^[\d]+[.)]\s*/, '').replace(/^[-\u2022\u25A1]\s*/, '');
    if (!line) continue;

    let owner = 'GENERAL';
    let action = line;

    for (const pattern of ownerPatterns) {
      const m = line.match(pattern);
      if (m) {
        owner = m[1].toUpperCase();
        action = m[2];
        break;
      }
    }

    const deadlineMatch = action.match(dateRe);
    const deadline = deadlineMatch ? deadlineMatch[1] : null;

    if (!groups.has(owner)) groups.set(owner, []);
    groups.get(owner)!.push({ text: action, deadline });
  }

  // Move GENERAL to the end
  const result: GroupedSteps[] = [];
  groups.forEach((actions, owner) => {
    if (owner !== 'GENERAL') result.push({ owner, actions });
  });
  if (groups.has('GENERAL')) {
    result.push({ owner: 'GENERAL', actions: groups.get('GENERAL')! });
  }

  return result;
}

// ── SCT detection ─────────────────────────────────────────────

const CLIENT_NARRATIVE = ['SITUATION', 'CHALLENGE', 'TRANSFORMATION'];
const BRAND_SCT = ['STRATEGY', 'CREATIVE', 'TACTIC'];

function isSCTHeader(h: string): boolean {
  const clean = h.replace(/\s*\(SCT\)\s*/i, '').trim();
  return [...CLIENT_NARRATIVE, ...BRAND_SCT].includes(clean);
}
function isGaps(h: string) { return /^GAPS/.test(h); }
function isNextSteps(h: string) { return /NEXT STEPS|RECOMMENDED NEXT/.test(h); }
function isStrategicNote(h: string) { return /STRATEGIC NOTE|^NOTE$/.test(h); }

// ── HTML builders ─────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderContentHtml(content: string, t: BrandTheme): string {
  const lines = content.split('\n');
  let html = '';

  // Detect leading block of consecutive key-value pairs for info grid
  const kvBlock: { label: string; value: string }[] = [];
  let kvEndIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { kvEndIdx = i + 1; continue; }
    const kv = line.match(/^([A-Z][A-Za-z\s\/&'\u2014]+?):\s+(.+)$/);
    if (kv && kv[1].length < 35) {
      kvBlock.push({ label: kv[1], value: kv[2] });
      kvEndIdx = i + 1;
    } else {
      break;
    }
  }

  // Render info grid if 2+ consecutive KV pairs
  if (kvBlock.length >= 2) {
    const cols = Math.min(kvBlock.length, 3);
    html += `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px 20px;margin-bottom:12px">`;
    for (const kv of kvBlock) {
      html += `<div>
        <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${t.textMuted};margin-bottom:3px">${escapeHtml(kv.label)}</div>
        <div style="font-size:13px;font-weight:500;color:${t.text}">${escapeHtml(kv.value)}</div>
      </div>`;
    }
    html += `</div>`;
  } else {
    kvEndIdx = 0;
  }

  // Render remaining lines
  for (let i = kvEndIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { html += '<div style="height:6px"></div>'; continue; }

    // Key-value pair (non-grid, inline)
    const kv = line.match(/^([A-Z][A-Za-z\s\/&'\u2014]+?):\s+(.+)$/);
    if (kv && kv[1].length < 35) {
      html += `<div style="display:flex;gap:8px;align-items:baseline;padding:2px 0">
        <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${t.textMuted};white-space:nowrap">${escapeHtml(kv[1])}</span>
        <span style="font-size:13px;font-weight:500;color:${t.text}">${escapeHtml(kv[2])}</span>
      </div>`;
      continue;
    }

    // List item
    if (/^[-\u2022\u25A1\u2713\u2717\u25AA]\s/.test(line)) {
      const item = line.replace(/^[-\u2022\u25A1\u2713\u2717\u25AA]\s*/, '');
      html += `<div style="display:flex;gap:6px;align-items:flex-start;padding:2px 0">
        <span style="color:${t.secondary};margin-top:2px;flex-shrink:0">\u00B7</span>
        <span style="font-size:13px;color:${addAlpha(t.text, 0.7)};line-height:${t.bodyLineHeight}">${escapeHtml(item)}</span>
      </div>`;
      continue;
    }

    // Quoted text
    if (/^".*"$/.test(line)) {
      html += `<div style="padding-left:12px;border-left:2px solid ${t.secondary};font-style:italic;font-size:13px;color:${addAlpha(t.text, 0.6)};line-height:${t.bodyLineHeight};margin:6px 0">${escapeHtml(line.slice(1, -1))}</div>`;
      continue;
    }

    // Plain text
    html += `<p style="font-size:13px;color:${addAlpha(t.text, 0.75)};line-height:${t.bodyLineHeight};margin:2px 0">${escapeHtml(line)}</p>`;
  }

  return html;
}

function addAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgba')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Main template builder ─────────────────────────────────────

export type PDFTemplateProps = {
  brief: string;
  brandId: string;
  brandName: string;
  brandTagline: string;
  briefTypeName: string;
  briefTypeId: string;
};

export function buildPDFHTML(props: PDFTemplateProps): string {
  const { brief, brandId, brandName, briefTypeName, briefTypeId } = props;
  const t = getTheme(brandId);
  const sections = parseSections(brief);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Extract title info
  const projectSection = sections.find(s => /^PROJECT/.test(s.header));
  const firstLine = projectSection?.content.split('\n')[0]?.trim() || '';
  const projectName = firstLine.replace(/^(?:Name|Project):\s*/i, '').split(/[,\n]/)[0]?.trim() || briefTypeName;
  const clientKV = projectSection?.content.match(/(?:Client|Prospect|Name):\s*(.+)/i);
  const clientName = clientKV ? clientKV[1].trim() : '';

  // Determine SCT mode
  const sctMode = (['lead-intake', 'discovery'].includes(briefTypeId)) ? 'client'
    : (['production', 'post-production'].includes(briefTypeId)) ? 'brand'
    : (briefTypeId === 'wrap-retention') ? 'dual'
    : 'none';

  // Categorize sections
  const regular: ParsedSection[] = [];
  const sctClient: ParsedSection[] = [];
  const sctBrand: ParsedSection[] = [];
  let gapsSection: ParsedSection | null = null;
  let nextStepsSection: ParsedSection | null = null;
  let noteSection: ParsedSection | null = null;

  for (const s of sections) {
    const clean = s.header.replace(/\s*\(SCT\)\s*/i, '').trim();
    if (CLIENT_NARRATIVE.includes(clean)) { sctClient.push(s); }
    else if (BRAND_SCT.includes(clean)) { sctBrand.push(s); }
    else if (isGaps(s.header)) { gapsSection = s; }
    else if (isNextSteps(s.header)) { nextStepsSection = s; }
    else if (isStrategicNote(s.header)) { noteSection = s; }
    else if (!/DELIVERY REFLECTION|REBOOKING FRAMING/i.test(s.header)) { regular.push(s); }
  }

  // ── Build HTML ──

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Panton Rust'; src: url('/fonts/PantonRustHeavy-GrSh.woff2') format('woff2'); font-weight: 800; font-style: normal; }
@font-face { font-family: 'Roboto'; src: url('/fonts/Roboto-Medium.ttf') format('truetype'); font-weight: 500; font-style: normal; }
@font-face { font-family: 'Shelten'; src: url('/fonts/Shelten.ttf') format('truetype'); font-weight: 400; font-style: normal; }
@font-face { font-family: 'Ovo'; src: url('/fonts/Ovo-Regular.ttf') format('truetype'); font-weight: 400; font-style: normal; }
* { margin: 0; padding: 0; box-sizing: border-box; }
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  .no-break { page-break-inside: avoid; }
}
</style></head>
<body style="width:960px;background:${t.bg};color:${t.text};font-family:${t.bodyFont};padding:48px 52px 40px">
`;

  // ── Header ──
  html += `<div style="margin-bottom:32px">`;
  html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">`;

  // Logo + brand label
  html += `<div style="display:flex;align-items:center;gap:10px">`;
  if (t.logoSrc) {
    html += `<img src="${t.logoSrc}" style="display:block;height:${t.logoHeight}px;max-height:${t.logoHeight}px;width:auto" crossorigin="anonymous" />`;
    html += `<span style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:${t.textMuted}">${escapeHtml(t.brandLabel)}</span>`;
  } else {
    // Oak & Cider styled text logo
    html += `<span style="font-family:${t.displayFont};font-size:18px;color:${t.accent}">Oak &amp; Cider</span>`;
    html += `<span style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:${t.textMuted}">${escapeHtml(t.brandLabel)}</span>`;
  }
  html += `</div>`;

  // Badge pills
  html += `<div style="display:flex;gap:8px">`;
  if (clientName) {
    html += `<span style="font-size:10px;font-weight:600;padding:4px 12px;border-radius:20px;background:${t.cardBg};border:1px solid ${t.cardBorder};color:${t.textMuted}">${escapeHtml(brandId === 'oakandcider' ? t.labelProspect : 'Client')}: ${escapeHtml(clientName)}</span>`;
  }
  html += `<span style="font-size:10px;font-weight:600;padding:4px 12px;border-radius:20px;background:${addAlpha(t.accent, 0.1)};border:1px solid ${addAlpha(t.accent, 0.25)};color:${t.accent}">${escapeHtml(briefTypeName)}</span>`;
  html += `</div></div>`;

  // Eyebrow + Title
  html += `<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:8px">BRIEF</div>`;
  html += `<div style="font-family:${t.displayFont};font-size:${t.titleSize};font-weight:800;text-transform:${t.titleTransform};letter-spacing:${t.titleSpacing};color:${t.text};margin-bottom:6px">${escapeHtml(projectName)}</div>`;

  // Subtitle
  const subtitleText = sections.find(s => /OPPORTUNITY|PROJECT SCOPE/.test(s.header))?.content.split('\n')[0]?.trim();
  if (subtitleText) {
    const subtitleStyle = brandId === 'oakandcider' ? 'font-style:italic;' : '';
    html += `<div style="font-size:13px;color:${t.textMuted};${subtitleStyle}margin-bottom:14px">${escapeHtml(subtitleText)}</div>`;
  }

  // Summary pills
  html += `<div style="display:flex;gap:16px;font-size:10px;color:${t.textMuted};margin-bottom:20px">`;
  html += `<span>${escapeHtml(brandName)}</span>`;
  html += `<span>\u00B7</span>`;
  html += `<span>${escapeHtml(date)}</span>`;
  html += `</div>`;

  // Separator
  html += `<div style="height:1px;background:${t.cardBorder}"></div>`;
  html += `</div>`;

  // ── Content sections ──
  for (const s of regular) {
    html += renderSectionBlock(s, t);
  }

  // ── SCT sections ──
  if (sctMode === 'client' && sctClient.length > 0) {
    html += renderSCTGroup(t.labelClientNarrative, sctClient, t);
  } else if (sctMode === 'brand' && sctBrand.length > 0) {
    html += renderSCTGroup('Execution Framework', sctBrand, t);
  } else if (sctMode === 'dual') {
    if (sctBrand.length > 0) html += renderSCTGroup('Delivery Reflection', sctBrand, t);
    if (sctClient.length > 0) html += renderSCTGroup(t.labelClientNarrative === 'Their Story' ? 'Rebooking \u2014 Their Story' : 'Rebooking Framing', sctClient, t);
  }

  // ── Strategic note ──
  if (noteSection) {
    html += `<div class="no-break" style="margin-top:28px;padding:16px 20px;background:${t.noteBg};border-left:3px solid ${t.noteBorder};border-radius:8px">`;
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${t.noteBorder};margin-bottom:8px">${escapeHtml(t.labelNote)}</div>`;
    html += renderContentHtml(noteSection.content, t);
    html += `</div>`;
  }

  // ── Gaps ──
  if (gapsSection) {
    const gapLines = gapsSection.content.split('\n').map(l => l.trim()).filter(Boolean)
      .map(l => l.replace(/^[-\u2022\u25A1\u2717\u26A0]\s*/, '').trim()).filter(Boolean);

    html += `<div class="no-break" style="margin-top:28px;padding:16px 20px;background:${t.gapsBg};border-left:3px solid ${t.gapsBorder};border-radius:8px">`;
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:12px">${escapeHtml(t.labelGaps)}</div>`;

    if (gapLines.length > 0) {
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 24px">`;
      for (const gap of gapLines) {
        html += `<div style="display:flex;gap:6px;align-items:flex-start">
          <span style="color:${t.accent};font-size:8px;margin-top:4px;flex-shrink:0">\u25CF</span>
          <span style="font-size:13px;color:${t.text};line-height:${t.bodyLineHeight}">${escapeHtml(gap)}</span>
        </div>`;
      }
      html += `</div>`;
    } else {
      const checkColor = t.tertiary || t.secondary;
      html += `<div style="font-size:13px;color:${checkColor}">\u2713 No gaps identified</div>`;
    }
    html += `</div>`;
  }

  // ── Next steps grouped by person ──
  if (nextStepsSection) {
    const groups = groupNextSteps(nextStepsSection.content);
    html += `<div class="no-break" style="margin-top:28px">`;
    html += sectionLabel('Next Steps', t);

    for (const group of groups) {
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:6px">${escapeHtml(group.owner)}</div>`;
      html += `<div style="border-left:2px solid ${t.secondary};padding-left:14px">`;
      for (const action of group.actions) {
        html += `<div style="display:flex;align-items:baseline;gap:8px;padding:3px 0">`;
        html += `<span style="font-size:13px;color:${addAlpha(t.text, 0.75)};line-height:${t.bodyLineHeight}">${escapeHtml(action.text)}</span>`;
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

  // ── Footer ──
  html += `<div style="margin-top:40px;padding-top:16px;border-top:1px solid ${t.cardBorder};display:flex;justify-content:space-between;align-items:center">`;
  html += `<span style="font-size:10px;color:${t.textMuted}">Generated by EPA \u00B7 ${escapeHtml(brandName)} \u00B7 ${escapeHtml(date)}</span>`;
  const tagFont = t.footerTaglineFont || t.bodyFont;
  const tagTransform = t.footerTaglineFont ? 'none' : 'uppercase';
  html += `<span style="font-family:${tagFont};font-size:10px;font-weight:700;text-transform:${tagTransform};color:${t.accent}">${escapeHtml(t.footerTagline)}</span>`;
  html += `</div>`;

  html += `</body></html>`;
  return html;
}

// ── Helpers ───────────────────────────────────────────────────

function sectionLabel(label: string, t: BrandTheme): string {
  return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};white-space:nowrap">${escapeHtml(label)}</span>
    <div style="flex:1;height:1px;background:${t.cardBorder}"></div>
  </div>`;
}

function renderSectionBlock(s: ParsedSection, t: BrandTheme): string {
  let html = `<div class="no-break" style="margin-top:24px">`;
  html += sectionLabel(s.header, t);
  html += `<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:10px;padding:16px 20px">`;
  html += renderContentHtml(s.content, t);
  html += `</div></div>`;
  return html;
}

function renderSCTGroup(groupLabel: string, sections: ParsedSection[], t: BrandTheme): string {
  let html = `<div class="no-break" style="margin-top:28px">`;
  html += sectionLabel(groupLabel, t);
  html += `<div style="display:flex;gap:0">`;
  // Vertical accent bar
  html += `<div style="width:3px;background:${t.secondary};border-radius:2px;flex-shrink:0;margin-right:14px"></div>`;
  html += `<div style="flex:1;display:flex;flex-direction:column;gap:10px">`;

  for (const s of sections) {
    const cleanLabel = s.header.replace(/\s*\(SCT\)\s*/i, '');
    html += `<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:10px;padding:14px 18px">`;
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${t.textMuted};margin-bottom:8px">${escapeHtml(cleanLabel)}</div>`;
    html += renderContentHtml(s.content, t);
    html += `</div>`;
  }

  html += `</div></div></div>`;
  return html;
}
