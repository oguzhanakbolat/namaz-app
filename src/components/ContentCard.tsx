import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { ContentBlock, Media } from '@/lib/types';
import { fonts, radius, space, useTheme } from '@/theme';
import { AudioButton } from './AudioButton';
import { RichText } from './RichText';

type IconName = keyof typeof Ionicons.glyphMap;

/** Bölüm anahtarına göre simge; panelden yeni bölüm eklenirse varsayılan simge kullanılır */
const ICONS: Record<string, IconName> = {
  ayet: 'book',
  hadis: 'chatbubble-ellipses',
  esma: 'sparkles',
  'veciz-soz': 'chatbox',
  dua: 'hand-left',
};

/** Görsel solda, metin sağda gösterilecek bölümler (esma gibi kısa Arapça ifadeler) */
const SIDE_LAYOUT = new Set(['esma']);

function ArabicVisual({ image, text, compact }: { image: Media | null; text: string | null; compact?: boolean }) {
  const t = useTheme();
  if (image) {
    const ratio = image.width && image.height ? image.width / image.height : compact ? 1 : 4;
    return (
      <Image
        source={{ uri: image.url }}
        style={
          compact
            ? { width: 112, aspectRatio: ratio, maxHeight: 130 }
            : { width: '100%', aspectRatio: ratio, maxHeight: 160 }
        }
        contentFit="contain"
        accessibilityLabel={image.alternativeText || text || 'Arapça metin'}
        transition={150}
      />
    );
  }
  if (!text) return null;
  return (
    <Text
      style={[
        styles.arabic,
        { color: t.paperText, fontFamily: fonts.arabic },
        compact && { fontSize: 34, lineHeight: 58, minWidth: 96 },
      ]}
    >
      {text}
    </Text>
  );
}

export function ContentCard({ block }: { block: ContentBlock }) {
  const t = useTheme();
  const { section, item } = block;
  if (!item) return null;

  const side = SIDE_LAYOUT.has(section.key);
  const subtitle = [item.title, item.source].filter(Boolean).join(' · ');
  const hasArabic = !!(item.arabicImage || item.arabicText);

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, shadowColor: t.shadow }]}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: t.primarySoft }]}>
          <Ionicons name={ICONS[section.key] || 'leaf'} size={18} color={t.primary} />
        </View>
        <View style={styles.headText}>
          <Text style={[styles.section, { color: t.text }]}>{section.name}</Text>
          {!!subtitle && (
            <Text style={[styles.subtitle, { color: t.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {item.audio && <AudioButton url={item.audio.url} />}
      </View>

      {side ? (
        <View style={styles.sideRow}>
          {hasArabic && (
            <View style={[styles.sideVisual, { backgroundColor: t.paper }]}>
              <ArabicVisual image={item.arabicImage} text={item.arabicText} compact />
            </View>
          )}
          <View style={styles.sideText}>
            {!!item.text && <RichText text={item.text} style={[styles.body, { color: t.text }]} />}
            {!!item.transliteration && (
              <Text style={[styles.translit, { color: t.textMuted }]}>{item.transliteration}</Text>
            )}
          </View>
        </View>
      ) : (
        <>
          {hasArabic && (
            <View style={[styles.arabicBox, { backgroundColor: t.paper }]}>
              <ArabicVisual image={item.arabicImage} text={item.arabicText} />
            </View>
          )}
          {!!item.transliteration && (
            <Text style={[styles.translit, { color: t.textMuted }]}>{item.transliteration}</Text>
          )}
          {!!item.text && <RichText text={item.text} style={[styles.body, { color: t.text }]} />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space(4),
    gap: space(3),
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1 },
  section: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 1 },
  arabicBox: { borderRadius: radius.md, paddingVertical: space(3), paddingHorizontal: space(3), alignItems: 'center' },
  arabic: { fontSize: 24, lineHeight: 46, textAlign: 'center', writingDirection: 'rtl' },
  translit: { fontSize: 13.5, fontStyle: 'italic' },
  body: { fontSize: 15, lineHeight: 22 },
  sideRow: { flexDirection: 'row', gap: space(3), alignItems: 'center' },
  sideVisual: { borderRadius: radius.md, padding: space(2), alignItems: 'center', justifyContent: 'center' },
  sideText: { flex: 1, gap: space(1.5) },
});
