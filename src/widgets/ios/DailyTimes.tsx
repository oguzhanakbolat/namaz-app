/**
 * iOS — "Günün Vakitleri": küçük widget. Altı vakit alt alta, şu anki vakit vurgulu.
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
  monospacedDigit,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type WidgetProps } from '../types';

const DailyTimes = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;

  return (
    <VStack spacing={1} modifiers={[containerBackground(c.transparent ? 'clear' : c.bg, 'widget')]}>
      {props.prayers.map((p, i) => {
        const active = i === props.current;
        return (
          <HStack
            key={p.label}
            modifiers={[
              padding({ horizontal: 8, vertical: 2 }),
              frame({ maxWidth: 10000 }),
              ...(active ? [background(c.active), cornerRadius(8)] : []),
            ]}
          >
            <Text
              modifiers={[
                font({ size: 14, weight: active ? 'semibold' : 'regular' }),
                foregroundStyle(active ? c.activeText : c.muted),
                lineLimit(1),
              ]}
            >
              {p.label}
            </Text>
            <Spacer />
            <Text
              modifiers={[
                font({ size: 15, weight: 'semibold', design: 'rounded' }),
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
  );
};

// Widget oluşturulamazsa (ör. Expo Go, eski Metro önbelleği) uygulama çökmesin; bu widget güncellenmez.
let widget: ReturnType<typeof createWidget<WidgetProps>> | null = null;
try {
  widget = createWidget('DailyTimes', DailyTimes, EMPTY_WIDGET_PROPS);
} catch (e) {
  console.warn('[widget] DailyTimes oluşturulamadı', e);
}

export default widget;
