import path from 'path';
import React from 'react';
import { Document, Page, View, Text, Image, Font, StyleSheet } from '@react-pdf/renderer';
import type { BriefSchema, SCTMode } from '@/types/brief-schema';

// ── Font registration (filesystem paths for server-side rendering) ──

const fontsDir = path.join(process.cwd(), 'public/fonts');

Font.register({
  family: 'Avenir Next',
  fonts: [
    { src: path.join(fontsDir, 'AvenirNext-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'AvenirNext-Medium.ttf'), fontWeight: 500 },
    { src: path.join(fontsDir, 'AvenirNext-Bold.ttf'), fontWeight: 700 },
    { src: path.join(fontsDir, 'AvenirNext-Heavy.ttf'), fontWeight: 800 },
  ],
});

Font.register({
  family: 'Panton Rust',
  src: path.join(fontsDir, 'PantonRustHeavy-GrSh.ttf'),
  fontWeight: 800,
});

Font.register({
  family: 'Roboto',
  src: path.join(fontsDir, 'Roboto-Medium.ttf'),
  fontWeight: 500,
});

Font.register({
  family: 'Shelten',
  src: path.join(fontsDir, 'Shelten.ttf'),
  fontWeight: 400,
});

Font.register({
  family: 'Ovo',
  src: path.join(fontsDir, 'Ovo-Regular.ttf'),
  fontWeight: 400,
});

// Disable word hyphenation
Font.registerHyphenationCallback((word) => [word]);

// ── Brand themes ────────────────────────────────────────────────

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
  titleTransform: 'uppercase' | 'none';
  titleSpacing: number;
  titleSize: number;
  bodyLineHeight: number;
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
    cardBg: '#1A1A1A',
    cardBorder: '#2A2A28',
    gapsBg: '#1F1210',
    noteBg: '#101A1A',
    noteBorder: '#49797B',
    logoSrc: path.join(process.cwd(), 'public/logos/fmc-cube.png'),
    logoHeight: 32,
    brandLabel: 'FERGUSON MEDIA COLLECTIVE',
    displayFont: 'Avenir Next',
    bodyFont: 'Avenir Next',
    footerTagline: 'Together We Win',
    titleTransform: 'uppercase',
    titleSpacing: 0.5,
    titleSize: 28,
    bodyLineHeight: 1.65,
    labelProspect: 'Prospect',
    labelGaps: 'Gaps \u2014 Critical Unknowns',
  },
  tourbus: {
    bg: '#F5F0E8',
    text: '#1A1A1A',
    textMuted: '#4A4A4A',
    accent: '#D42B2B',
    secondary: '#C41E3A',
    cardBg: '#EDE8E0',
    cardBorder: '#D8D3CB',
    gapsBg: '#F5ECEC',
    noteBg: '#F5ECEC',
    noteBorder: '#C41E3A',
    logoSrc: path.join(process.cwd(), 'public/logos/tbe-badge.png'),
    logoHeight: 40,
    brandLabel: 'TOUR BUS ENTERTAINMENT',
    displayFont: 'Panton Rust',
    bodyFont: 'Roboto',
    footerTagline: 'Taking You Beyond the Stage...',
    titleTransform: 'uppercase',
    titleSpacing: 0.5,
    titleSize: 28,
    bodyLineHeight: 1.65,
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
    cardBg: '#F2EDE6',
    cardBorder: '#E0DBD4',
    gapsBg: '#F7F1E8',
    noteBg: '#EFF3ED',
    noteBorder: '#7A8B6F',
    logoSrc: null,
    logoHeight: 0,
    brandLabel: 'STUDIOS',
    displayFont: 'Shelten',
    bodyFont: 'Ovo',
    footerTagline: 'Bespoke Wedding Documentary',
    footerTaglineFont: 'Shelten',
    titleTransform: 'none',
    titleSpacing: -0.2,
    titleSize: 28,
    bodyLineHeight: 1.75,
    labelProspect: 'The Couple',
    labelGaps: 'Still Needed',
  },
};

function getTheme(brandId: string): BrandTheme {
  return themes[brandId] || themes.fmc;
}

// ── Helpers ──────────────────────────────────────────────────────

function tx(text: string, transform: 'uppercase' | 'none'): string {
  return transform === 'uppercase' ? text.toUpperCase() : text;
}

function severityColor(severity: string | undefined, t: BrandTheme): string {
  if (severity === 'critical') return t.accent;
  if (severity === 'moderate') return t.secondary;
  return t.tertiary || t.textMuted;
}

// ── Reusable sub-components ──────────────────────────────────────

function SectionLabel({ label, theme: t }: { label: string; theme: BrandTheme }) {
  const tracking = t.titleTransform === 'none' ? 1 : 2.5;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <Text style={{
        fontFamily: t.displayFont,
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: tracking,
        color: t.accent,
      }}>
        {tx(label, t.titleTransform)}
      </Text>
      <View style={{ flex: 1, height: 0.75, backgroundColor: t.cardBorder }} />
    </View>
  );
}

// ── Main component ───────────────────────────────────────────────

export type BriefPDFProps = {
  data: BriefSchema;
  brandId: string;
  brandName: string;
  briefTypeName: string;
  sctMode: SCTMode;
};

export function BriefPDF({ data, brandId, brandName, briefTypeName, sctMode }: BriefPDFProps) {
  const t = getTheme(brandId);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isOC = brandId === 'oakandcider';

  const bodyText = StyleSheet.create({
    base: {
      fontFamily: t.bodyFont,
      fontSize: 11,
      color: t.text,
      lineHeight: t.bodyLineHeight,
    },
    muted: {
      fontFamily: t.bodyFont,
      fontSize: 11,
      color: t.textMuted,
      lineHeight: t.bodyLineHeight,
    },
  });

  // Group next steps by owner
  const nextStepGroups = (() => {
    const groups = new Map<string, typeof data.nextSteps>();
    for (const step of data.nextSteps) {
      const owner = step.owner || 'General';
      if (!groups.has(owner)) groups.set(owner, []);
      groups.get(owner)!.push(step);
    }
    const orderedKeys = Array.from(groups.keys()).filter(k => k !== 'General');
    if (groups.has('General')) orderedKeys.push('General');
    return { groups, orderedKeys };
  })();

  return (
    <Document>
      <Page size="LETTER" style={{ backgroundColor: t.bg, paddingHorizontal: 48, paddingTop: 48, paddingBottom: 40, fontFamily: t.bodyFont }}>

        {/* ── Header ─────────────────────────────────── */}
        <View style={{ marginBottom: 24 }}>
          {/* Logo row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {t.logoSrc ? (
                <>
                  <Image src={t.logoSrc} style={{ height: t.logoHeight, width: t.logoHeight }} />
                  <Text style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: t.textMuted }}>{t.brandLabel}</Text>
                </>
              ) : (
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ fontFamily: t.displayFont, fontSize: 18, color: t.accent }}>Oak & Cider</Text>
                  <Text style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 3, color: t.textMuted, marginTop: 1 }}>{t.brandLabel}</Text>
                </View>
              )}
            </View>

            {/* Badge pill */}
            <View style={{
              paddingVertical: 3,
              paddingHorizontal: 10,
              borderRadius: 20,
              backgroundColor: t.gapsBg,
              borderWidth: 1,
              borderColor: t.accent,
            }}>
              <Text style={{ fontSize: 8.5, fontWeight: 600, color: t.accent }}>{briefTypeName}</Text>
            </View>
          </View>

          {/* Eyebrow */}
          <Text style={{
            fontFamily: t.displayFont,
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: t.titleTransform === 'none' ? 1 : 2.5,
            color: t.accent,
            marginBottom: 6,
          }}>
            {tx('Brief', t.titleTransform)}
          </Text>

          {/* Title */}
          <Text style={{
            fontFamily: t.displayFont,
            fontSize: t.titleSize,
            fontWeight: 800,
            letterSpacing: t.titleSpacing,
            color: t.text,
            marginBottom: 4,
          }}>
            {isOC ? data.projectName : data.projectName.toUpperCase()}
          </Text>

          {/* Description */}
          {data.projectDescription && (
            <Text style={{
              fontSize: 11,
              color: t.textMuted,
              fontStyle: isOC ? 'italic' : 'normal',
              marginBottom: 12,
            }}>
              {data.projectDescription}
            </Text>
          )}

          {/* Meta line */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 8.5, color: t.textMuted }}>{brandName}</Text>
            <Text style={{ fontSize: 8.5, color: t.textMuted }}>{'\u00B7'}</Text>
            <Text style={{ fontSize: 8.5, color: t.textMuted }}>{date}</Text>
          </View>

          {/* Separator */}
          <View style={{ height: 1, backgroundColor: t.accent, opacity: 0.3 }} />
        </View>

        {/* ── Context grid ───────────────────────────── */}
        {data.context.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <SectionLabel label={t.labelProspect} theme={t} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {data.context.map((kv, i) => (
                <View key={i} style={{
                  width: data.context.length <= 3 ? `${Math.floor(100 / data.context.length) - 2}%` as any : '31%',
                  backgroundColor: t.cardBg,
                  borderWidth: 1,
                  borderColor: t.cardBorder,
                  borderRadius: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                }}>
                  <Text style={{
                    fontFamily: t.displayFont,
                    fontSize: 7,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: t.accent,
                    marginBottom: 3,
                  }}>
                    {tx(kv.label, t.titleTransform)}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: 500, color: t.text }}>{kv.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Content sections ───────────────────────── */}
        {data.sections.map((section, si) => (
          <View key={`s-${si}`} style={{ marginBottom: 16 }} wrap={false}>
            <SectionLabel label={section.header} theme={t} />
            <View style={{
              backgroundColor: t.cardBg,
              borderWidth: 1,
              borderColor: t.cardBorder,
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}>
              {section.body && section.body.split('\n').filter(l => l.trim()).map((line, li) => (
                <Text key={li} style={{ ...bodyText.base, marginBottom: 2 }}>{line}</Text>
              ))}

              {section.items && section.items.length > 0 && (
                <View style={{ marginTop: section.body ? 6 : 0 }}>
                  {section.items.map((item, ii) => (
                    <View key={ii} style={{ flexDirection: 'row', gap: 5, paddingVertical: 1.5 }}>
                      <Text style={{ color: t.secondary, fontSize: 11, marginTop: 1 }}>{'\u00B7'}</Text>
                      <Text style={bodyText.base}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {section.keyValues && section.keyValues.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {section.keyValues.map((kv, ki) => (
                    <View key={ki} style={{
                      width: '31%',
                      backgroundColor: t.bg,
                      borderRadius: 5,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                    }}>
                      <Text style={{
                        fontFamily: t.displayFont,
                        fontSize: 7,
                        fontWeight: 700,
                        letterSpacing: 1.5,
                        color: t.accent,
                        marginBottom: 2,
                      }}>
                        {tx(kv.label, t.titleTransform)}
                      </Text>
                      <Text style={{ fontSize: 11, color: t.text }}>{kv.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {section.checklist && section.checklist.length > 0 && (
                <View style={{ marginTop: section.body ? 6 : 0 }}>
                  {section.checklist.map((item, ci) => (
                    <View key={ci} style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
                      <Text style={{
                        color: item.checked ? (t.tertiary || t.secondary) : t.textMuted,
                        fontSize: 12,
                      }}>
                        {item.checked ? '\u2713' : '\u25A1'}
                      </Text>
                      <Text style={bodyText.base}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        {/* ── SCT Primary ────────────────────────────── */}
        {data.sctPrimary && sctMode !== 'none' && (
          <View style={{ marginTop: 8, marginBottom: 16 }} wrap={false}>
            <SectionLabel label={data.sctPrimary.groupLabel} theme={t} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {data.sctPrimary.blocks.map((block, bi) => (
                <View key={bi} style={{
                  flex: 1,
                  borderLeftWidth: 3,
                  borderLeftColor: t.accent,
                  backgroundColor: t.cardBg,
                  borderTopRightRadius: 6,
                  borderBottomRightRadius: 6,
                  paddingVertical: 10,
                  paddingLeft: 14,
                  paddingRight: 12,
                }}>
                  <Text style={{
                    fontFamily: t.displayFont,
                    fontSize: 7.5,
                    fontWeight: 700,
                    letterSpacing: t.titleTransform === 'none' ? 1 : 2,
                    color: t.accent,
                    marginBottom: 6,
                  }}>
                    {tx(block.label, t.titleTransform)}
                  </Text>
                  {block.content.split('\n').filter(l => l.trim()).map((line, li) => (
                    <Text key={li} style={{ fontSize: 10, color: t.text, lineHeight: t.bodyLineHeight, marginBottom: 1 }}>{line}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── SCT Secondary ──────────────────────────── */}
        {data.sctSecondary && sctMode === 'dual' && (
          <View style={{ marginBottom: 16 }} wrap={false}>
            <SectionLabel label={data.sctSecondary.groupLabel} theme={t} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {data.sctSecondary.blocks.map((block, bi) => (
                <View key={bi} style={{
                  flex: 1,
                  borderLeftWidth: 3,
                  borderLeftColor: t.accent,
                  backgroundColor: t.cardBg,
                  borderTopRightRadius: 6,
                  borderBottomRightRadius: 6,
                  paddingVertical: 10,
                  paddingLeft: 14,
                  paddingRight: 12,
                }}>
                  <Text style={{
                    fontFamily: t.displayFont,
                    fontSize: 7.5,
                    fontWeight: 700,
                    letterSpacing: t.titleTransform === 'none' ? 1 : 2,
                    color: t.accent,
                    marginBottom: 6,
                  }}>
                    {tx(block.label, t.titleTransform)}
                  </Text>
                  {block.content.split('\n').filter(l => l.trim()).map((line, li) => (
                    <Text key={li} style={{ fontSize: 10, color: t.text, lineHeight: t.bodyLineHeight, marginBottom: 1 }}>{line}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Strategic note ─────────────────────────── */}
        {data.strategicNote && (
          <View style={{
            marginTop: 8,
            marginBottom: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: t.noteBg,
            borderLeftWidth: 3,
            borderLeftColor: t.noteBorder,
            borderTopRightRadius: 6,
            borderBottomRightRadius: 6,
          }} wrap={false}>
            <Text style={{
              fontFamily: t.displayFont,
              fontSize: 7.5,
              fontWeight: 700,
              letterSpacing: t.titleTransform === 'none' ? 1 : 2,
              color: t.noteBorder,
              marginBottom: 6,
            }}>
              {isOC ? 'Note' : 'STRATEGIC NOTE'}
            </Text>
            <Text style={bodyText.base}>{data.strategicNote}</Text>
          </View>
        )}

        {/* ── Gaps ───────────────────────────────────── */}
        {data.gaps.length > 0 && (
          <View style={{
            marginTop: 8,
            marginBottom: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: t.gapsBg,
            borderLeftWidth: 4,
            borderLeftColor: t.accent,
            borderTopRightRadius: 6,
            borderBottomRightRadius: 6,
          }} wrap={false}>
            <Text style={{
              fontFamily: t.displayFont,
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: t.titleTransform === 'none' ? 1 : 2.5,
              color: t.accent,
              marginBottom: 10,
            }}>
              {tx(t.labelGaps, t.titleTransform)}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {data.gaps.map((gap, gi) => (
                <View key={gi} style={{
                  width: '50%',
                  flexDirection: 'row',
                  gap: 5,
                  paddingRight: 12,
                  paddingVertical: 2,
                }}>
                  <Text style={{ color: severityColor(gap.severity, t), fontSize: 7, marginTop: 3 }}>{'\u25CF'}</Text>
                  <Text style={{ fontSize: 11, color: t.text, lineHeight: t.bodyLineHeight }}>{gap.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Next steps ─────────────────────────────── */}
        {data.nextSteps.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <SectionLabel label="Next Steps" theme={t} />
            {nextStepGroups.orderedKeys.map((owner, gi) => (
              <View key={gi} style={{ marginBottom: 12 }} wrap={false}>
                <Text style={{
                  fontFamily: t.displayFont,
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: t.titleTransform === 'none' ? 1 : 2,
                  color: t.accent,
                  marginBottom: 5,
                  paddingBottom: 3,
                  borderBottomWidth: 0.75,
                  borderBottomColor: t.cardBorder,
                }}>
                  {tx(owner, t.titleTransform)}
                </Text>
                <View style={{ borderLeftWidth: 2, borderLeftColor: t.secondary, paddingLeft: 12 }}>
                  {nextStepGroups.groups.get(owner)!.map((action, ai) => (
                    <View key={ai} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingVertical: 2 }}>
                      <Text style={{ color: t.accent, opacity: 0.4, fontSize: 10 }}>{'\u2192'}</Text>
                      <Text style={{ fontSize: 11, color: t.text, lineHeight: t.bodyLineHeight, flex: 1 }}>{action.action}</Text>
                      {action.deadline && (
                        <View style={{
                          backgroundColor: t.cardBg,
                          borderRadius: 10,
                          paddingVertical: 1.5,
                          paddingHorizontal: 7,
                        }}>
                          <Text style={{
                            fontSize: 7.5,
                            fontWeight: 600,
                            color: t.tertiary || t.secondary,
                          }}>
                            {action.deadline}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Footer ─────────────────────────────────── */}
        <View style={{
          marginTop: 'auto',
          paddingTop: 14,
          borderTopWidth: 0.75,
          borderTopColor: t.cardBorder,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }} fixed>
          <Text style={{ fontSize: 8, color: t.textMuted }}>
            Generated by EPA {'\u00B7'} {brandName} {'\u00B7'} {date}
          </Text>
          <Text style={{
            fontFamily: t.footerTaglineFont || t.displayFont,
            fontSize: 8.5,
            fontWeight: 700,
            fontStyle: t.footerTaglineFont ? 'italic' : 'normal',
            color: t.accent,
          }}>
            {t.footerTagline}
          </Text>
        </View>

      </Page>
    </Document>
  );
}

export function createBriefPDF(props: BriefPDFProps) {
  return React.createElement(BriefPDF, props) as React.ReactElement;
}
