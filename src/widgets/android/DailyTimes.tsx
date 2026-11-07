/**
 * Android — "Günün Vakitleri" (2x2). Altı vakit alt alta, şu anki vakit vurgulu.
 * Renkler props.palette'ten gelir (uygulamadaki Widget Ayarları).
 *
 * Yerleşim notu: Android widget'larında (Glance) spaceBetween/weight yok.
 *  - Her satır tam genişlikte bir Box: vakit adı sola, saat ayrı bir katmanda sağa hizalı.
 *  - Liste dikeyde ortalanır (widget büyütülünce satırlar ortada kalır).
 */
import { Box, Column, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
} from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type WidgetProps } from '../types';

const DailyTimes = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;

  return (
    <Box
      contentAlignment="center"
      modifiers={[fillMaxSize(), ...(c.transparent ? [] : [background(c.bg), cornerRadius(20)]), paddingAll(6)]}
    >
      <Column modifiers={[fillMaxWidth()]}>
        {props.prayers.map((p, i) => {
          const active = i === props.current;
          return (
            <Box
              key={p.label}
              contentAlignment="centerStart"
              modifiers={[
                fillMaxWidth(),
                ...(active ? [background(c.active), cornerRadius(10)] : []),
                padding(10, 2, 10, 2),
              ]}
            >
              <Text
                color={active ? c.activeText : c.muted}
                maxLines={1}
                style={{ fontSize: 13, fontWeight: active ? '600' : '400' }}
              >
                {p.label}
              </Text>
              <Box contentAlignment="centerEnd" modifiers={[fillMaxWidth()]}>
                <Text color={active ? c.activeText : c.text} maxLines={1} style={{ fontSize: 14, fontWeight: '700' }}>
                  {p.time}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Column>
    </Box>
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
