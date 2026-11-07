/**
 * Ayar ekranı yapı taşları. Yeni bir ayar eklerken bunları kullanın:
 *  <SettingsSection title="..." footer="...">
 *    <SettingsRow label="..." description="...">
 *      <Segmented options={[...]} value={...} onChange={...} />
 *    </SettingsRow>
 *  </SettingsSection>
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, space, useTheme } from '@/theme';

export function SettingsSection({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      {title && <Text style={[styles.sectionTitle, { color: t.textMuted }]}>{title}</Text>}
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>{children}</View>
      {footer && <Text style={[styles.footer, { color: t.textSoft }]}>{footer}</Text>}
    </View>
  );
}

/** Bir ayar satırı. children: sağda (inline) ya da altta (stacked) gösterilen kontrol */
export function SettingsRow({
  label,
  description,
  children,
  stacked = true,
  first,
  onPress,
}: {
  label: string;
  description?: string;
  children?: ReactNode;
  stacked?: boolean;
  first?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  const content = (
    <View
      style={[
        styles.row,
        !stacked && styles.rowInline,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
      ]}
    >
      <View style={!stacked && styles.flex}>
        <Text style={[styles.label, { color: t.text }]}>{label}</Text>
        {description && <Text style={[styles.description, { color: t.textMuted }]}>{description}</Text>}
      </View>
      {children && <View style={stacked ? styles.controlStacked : undefined}>{children}</View>}
      {onPress && !children && <Ionicons name="chevron-forward" size={18} color={t.textSoft} />}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  ) : (
    content
  );
}

export type SegmentOption<T extends string> = { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap };

/** Seçenekler arasında tek seçim (iOS tarzı bölümlü düğme) */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={[styles.segmented, { backgroundColor: t.surfaceMuted, borderColor: t.border }]}
      accessibilityRole="radiogroup"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            style={[
              styles.segment,
              selected && [styles.segmentSelected, { backgroundColor: t.surface, shadowColor: t.shadow }],
            ]}
          >
            {o.icon && <Ionicons name={o.icon} size={16} color={selected ? t.primary : t.textMuted} />}
            <Text
              style={[
                styles.segmentText,
                { color: selected ? t.text : t.textMuted },
                selected && styles.segmentTextSelected,
              ]}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Renk seçici (yuvarlak renk örnekleri) */
export function Swatches<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; color: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.swatches} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            style={styles.swatchItem}
            hitSlop={4}
          >
            <View style={[styles.swatchRing, { borderColor: selected ? o.color : 'transparent' }]}>
              <View style={[styles.swatch, { backgroundColor: o.color }]}>
                {selected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </View>
            </View>
            <Text style={[styles.swatchLabel, { color: selected ? t.text : t.textMuted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: space(2) },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: space(1),
  },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  footer: { fontSize: 12.5, lineHeight: 18, marginHorizontal: space(1) },
  row: { paddingHorizontal: space(4), paddingVertical: space(3.5), gap: space(3) },
  rowInline: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 15.5, fontWeight: '600' },
  description: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  controlStacked: {},
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 3, borderWidth: StyleSheet.hairlineWidth },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: space(2.25),
    borderRadius: radius.md - 3,
  },
  segmentSelected: { shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: 13.5, fontWeight: '500' },
  segmentTextSelected: { fontWeight: '700' },
  swatches: { flexDirection: 'row', justifyContent: 'space-between' },
  swatchItem: { alignItems: 'center', gap: 4 },
  swatchRing: { padding: 2, borderRadius: 24, borderWidth: 2 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { fontSize: 12, fontWeight: '500' },
});
