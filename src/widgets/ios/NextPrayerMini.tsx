/**
 * iOS — "Sıradaki Vakit (Mini)": yalnızca "Akşama 17:47".
 *  - Kilit ekranı yuvarlak widget (iOS'ta 1x1'in karşılığı)
 *  - Ana ekran küçük widget, her zaman şeffaf arka plan isteğiyle (iOS ana ekran widget'larında şeffaflığı
 *    garanti etmez; sistem desteklemezse varsayılan zemin görünür). Yazı rengi Widget Ayarları'ndan
 *    (beyaz/siyah), her duvar kâğıdında okunsun diye gölgeli.
 */
import { Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  shadow,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type WidgetProps } from '../types';

const NextPrayerMini = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;
  const label = props.ready ? props.nextDative : 'Vakit';
  const time = props.ready ? props.nextTime : '--:--';

  // Kilit ekranı: yuvarlak (renkleri sistem belirler)
  if (env.widgetFamily === 'accessoryCircular') {
    return (
      <VStack spacing={0} modifiers={[containerBackground('clear', 'widget')]}>
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), lineLimit(1), minimumScaleFactor(0.6)]}>{label}</Text>
        <Text
          modifiers={[
            font({ size: 16, weight: 'bold', design: 'rounded' }),
            monospacedDigit(),
            lineLimit(1),
            minimumScaleFactor(0.6),
          ]}
        >
          {time}
        </Text>
      </VStack>
    );
  }

  // Ana ekran: küçük, şeffaf
  return (
    <VStack spacing={2} modifiers={[containerBackground('clear', 'widget')]}>
      <Text
        modifiers={[
          font({ size: 20, weight: 'semibold' }),
          foregroundStyle(c.overlayText),
          shadow({ radius: 3, y: 1, color: c.overlayShadow }),
          lineLimit(1),
          minimumScaleFactor(0.6),
        ]}
      >
        {label}
      </Text>
      <Text
        modifiers={[
          font({ size: 40, weight: 'bold', design: 'rounded' }),
          monospacedDigit(),
          foregroundStyle(c.overlayText),
          shadow({ radius: 4, y: 1, color: c.overlayShadow }),
          lineLimit(1),
          minimumScaleFactor(0.6),
        ]}
      >
        {time}
      </Text>
    </VStack>
  );
};

// Widget oluşturulamazsa (ör. Expo Go, eski Metro önbelleği) uygulama çökmesin; bu widget güncellenmez.
let widget: ReturnType<typeof createWidget<WidgetProps>> | null = null;
try {
  widget = createWidget('NextPrayerMini', NextPrayerMini, EMPTY_WIDGET_PROPS);
} catch (e) {
  console.warn('[widget] NextPrayerMini oluşturulamadı', e);
}

export default widget;
