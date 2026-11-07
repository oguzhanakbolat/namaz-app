/**
 * iOS — "Sıradaki Vakit": küçük ana ekran widget'ı + kilit ekranı (dikdörtgen, satır içi).
 * Geri sayımı sistem işletir (Text timerInterval), uygulama her vakit girişini zaman çizelgesiyle verir.
 * Renkler props.palette'ten gelir (uygulamadaki Widget Ayarları).
 *
 * Widget fonksiyonu ayrı bir ortamda çalışır: dışarıdaki sabitlere/fonksiyonlara erişemez,
 * yalnızca Expo UI bileşenleri kullanılabilir.
 */
import { Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
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

const NextPrayer = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;
  const bg = c.transparent
    ? 'clear'
    : {
        type: 'linearGradient' as const,
        colors: [c.hero, c.heroDeep],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 },
      };
  const family = env.widgetFamily;

  if (!props.ready) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={[containerBackground(bg, 'widget')]}>
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(c.heroText)]}>Namaz Vakti</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(c.heroMuted)]}>Konum seçmek için uygulamayı açın</Text>
      </VStack>
    );
  }

  const timer = { lower: new Date(props.currentStart), upper: new Date(props.nextAt) };

  // Kilit ekranı: tek satır (renkleri sistem belirler)
  if (family === 'accessoryInline') {
    return <Text modifiers={[containerBackground('clear', 'widget')]}>{`${props.nextLabel} ${props.nextTime}`}</Text>;
  }

  // Kilit ekranı: dikdörtgen (renkleri sistem belirler)
  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={0} modifiers={[containerBackground('clear', 'widget')]}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), lineLimit(1)]}>{props.nextDative}</Text>
        <Text
          timerInterval={timer}
          countsDown
          modifiers={[font({ size: 24, weight: 'bold', design: 'rounded' }), monospacedDigit(), lineLimit(1)]}
        />
        <Text modifiers={[font({ size: 11 }), lineLimit(1)]}>{`${props.nextTime} · ${props.city}`}</Text>
      </VStack>
    );
  }

  // Ana ekran: küçük
  return (
    <VStack
      alignment="leading"
      spacing={2}
      modifiers={[
        frame({ maxWidth: 10000, maxHeight: 10000, alignment: 'topLeading' }),
        containerBackground(bg, 'widget'),
      ]}
    >
      <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(c.heroMuted), lineLimit(1)]}>
        {props.city}
      </Text>
      <Spacer />
      <Text modifiers={[font({ size: 17, weight: 'semibold' }), foregroundStyle(c.heroText), lineLimit(1)]}>
        {props.nextDative}
      </Text>
      <Text
        timerInterval={timer}
        countsDown
        modifiers={[
          font({ size: 34, weight: 'bold', design: 'rounded' }),
          monospacedDigit(),
          foregroundStyle(c.heroAccent),
          lineLimit(1),
          minimumScaleFactor(0.6),
        ]}
      />
      <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(c.heroMuted), padding({ top: 2 })]}>
        {`Vakit ${props.nextTime}`}
      </Text>
    </VStack>
  );
};

// Widget oluşturulamazsa (ör. Expo Go, eski Metro önbelleği) uygulama çökmesin; bu widget güncellenmez.
let widget: ReturnType<typeof createWidget<WidgetProps>> | null = null;
try {
  widget = createWidget('NextPrayer', NextPrayer, EMPTY_WIDGET_PROPS);
} catch (e) {
  console.warn('[widget] NextPrayer oluşturulamadı', e);
}

export default widget;
