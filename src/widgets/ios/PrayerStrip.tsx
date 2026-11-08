/**
 * iOS — "Vakit Şeridi": orta boy widget. Üstte konum, hicri tarih ve geri sayım; altta altı vakit yan yana,
 * şu anki vakit vurgulu. (iOS ana ekranında 4x1 boyut yok; Android'deki 4x1 şeridin iOS karşılığıdır.)
 * Renkler props.palette'ten gelir (uygulamadaki Widget Ayarları).
 */
import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  multilineTextAlignment,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type WidgetProps } from '../types';

const PrayerStrip = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;

  return (
    <VStack spacing={8} modifiers={[containerBackground(c.transparent ? 'clear' : c.bg, 'widget')]}>
      <HStack spacing={6}>
        <VStack alignment="leading" spacing={0}>
          <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(c.text), lineLimit(1)]}>
            {props.city}
          </Text>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(c.muted), lineLimit(1)]}>
            {props.ready ? props.hijri : 'Konum seçmek için uygulamayı açın'}
          </Text>
        </VStack>
        <Spacer />
        {props.ready && (
          <VStack alignment="trailing" spacing={0}>
            <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(c.muted), lineLimit(1)]}>
              {props.nextDative}
            </Text>
            <Text
              timerInterval={{ lower: new Date(props.currentStart), upper: new Date(props.nextAt) }}
              countsDown
              modifiers={[
                font({ size: 20, weight: 'bold', design: 'rounded' }),
                monospacedDigit(),
                foregroundStyle(c.accent),
                lineLimit(1),
                minimumScaleFactor(0.7),
                // Geri sayım metni en geniş hali için yer ayırır ve yazıyı içinde sola dizer;
                // sağa yaslamak için hem metin hizası hem çerçeve hizası trailing olmalı.
                multilineTextAlignment('trailing'),
                frame({ width: 92, alignment: 'trailing' }),
              ]}
            />
          </VStack>
        )}
      </HStack>

      <HStack spacing={4}>
        {props.prayers.map((p, i) => {
          const active = i === props.current;
          const cellBg = active ? [background(c.active)] : c.transparent ? [] : [background(c.surface)];
          return (
            <VStack
              key={p.label}
              spacing={2}
              modifiers={[padding({ vertical: 8 }), frame({ maxWidth: 10000 }), ...cellBg, cornerRadius(10)]}
            >
              <Text
                modifiers={[
                  font({ size: 11, weight: 'medium' }),
                  foregroundStyle(active ? c.activeMuted : c.muted),
                  lineLimit(1),
                  minimumScaleFactor(0.8),
                ]}
              >
                {p.label}
              </Text>
              <Text
                modifiers={[
                  font({ size: 14, weight: 'bold', design: 'rounded' }),
                  monospacedDigit(),
                  foregroundStyle(active ? c.activeText : c.text),
                  lineLimit(1),
                  minimumScaleFactor(0.8),
                ]}
              >
                {p.time}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    </VStack>
  );
};

// Widget oluşturulamazsa (ör. Expo Go, eski Metro önbelleği) uygulama çökmesin; bu widget güncellenmez.
let widget: ReturnType<typeof createWidget<WidgetProps>> | null = null;
try {
  widget = createWidget('PrayerStrip', PrayerStrip, EMPTY_WIDGET_PROPS);
} catch (e) {
  console.warn('[widget] PrayerStrip oluşturulamadı', e);
}

export default widget;
