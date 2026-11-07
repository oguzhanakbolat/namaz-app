/**
 * iOS — "Vakit Paneli": orta boy widget. Solda sıradaki vakte geri sayım, sağda günün vakitleri.
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
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type WidgetProps } from '../types';

const PrayerPanel = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;
  const hero = {
    type: 'linearGradient' as const,
    colors: [c.hero, c.heroDeep],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };

  return (
    <HStack spacing={10} modifiers={[containerBackground(c.transparent ? 'clear' : c.bg, 'widget')]}>
      {/* Geri sayım bloğu */}
      <VStack
        alignment="leading"
        spacing={2}
        modifiers={[
          padding({ all: 12 }),
          frame({ maxWidth: 10000, maxHeight: 10000, alignment: 'topLeading' }),
          ...(c.transparent ? [] : [background(hero), cornerRadius(16)]),
        ]}
      >
        <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(c.heroMuted), lineLimit(1)]}>
          {props.city}
        </Text>
        <Spacer />
        {props.ready ? (
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundStyle(c.heroText), lineLimit(1)]}>
              {props.nextDative}
            </Text>
            <Text
              timerInterval={{ lower: new Date(props.currentStart), upper: new Date(props.nextAt) }}
              countsDown
              modifiers={[
                font({ size: 30, weight: 'bold', design: 'rounded' }),
                monospacedDigit(),
                foregroundStyle(c.heroAccent),
                lineLimit(1),
                minimumScaleFactor(0.6),
              ]}
            />
            <Text modifiers={[font({ size: 11 }), foregroundStyle(c.heroMuted), lineLimit(1)]}>{props.hijri}</Text>
          </VStack>
        ) : (
          <Text modifiers={[font({ size: 13 }), foregroundStyle(c.heroText)]}>Konum seçmek için uygulamayı açın</Text>
        )}
      </VStack>

      {/* Vakit listesi */}
      <VStack spacing={1} modifiers={[frame({ width: 132 })]}>
        {props.prayers.map((p, i) => {
          const active = i === props.current;
          return (
            <HStack
              key={p.label}
              modifiers={[
                padding({ horizontal: 8, vertical: 2 }),
                ...(active ? [background(c.active), cornerRadius(8)] : []),
              ]}
            >
              <Text
                modifiers={[
                  font({ size: 13.5, weight: active ? 'semibold' : 'regular' }),
                  foregroundStyle(active ? c.activeText : c.muted),
                  lineLimit(1),
                ]}
              >
                {p.label}
              </Text>
              <Spacer />
              <Text
                modifiers={[
                  font({ size: 14.5, weight: 'semibold', design: 'rounded' }),
                  monospacedDigit(),
                  foregroundStyle(active ? c.activeText : c.text),
                ]}
              >
                {p.time}
              </Text>
            </HStack>
          );
        })}
      </VStack>
    </HStack>
  );
};

// Widget oluşturulamazsa (ör. Expo Go, eski Metro önbelleği) uygulama çökmesin; bu widget güncellenmez.
let widget: ReturnType<typeof createWidget<WidgetProps>> | null = null;
try {
  widget = createWidget('PrayerPanel', PrayerPanel, EMPTY_WIDGET_PROPS);
} catch (e) {
  console.warn('[widget] PrayerPanel oluşturulamadı', e);
}

export default widget;
