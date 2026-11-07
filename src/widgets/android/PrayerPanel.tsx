/**
 * Android — "Vakit Paneli" (4x2). Solda sıradaki vakit, sağda günün vakitleri.
 * Renkler props.palette'ten gelir (uygulamadaki Widget Ayarları).
 *
 * Yerleşim notu: Android widget'larında (Glance) spaceBetween/weight yok.
 *  - Sol blok: konum üstte, sıradaki vakit altta (üst üste iki Box katmanı).
 *  - Sağ liste: her satır tam genişlikte Box; vakit adı sola, saat sağa hizalı; liste dikeyde ortalı.
 */
import { Box, Column, Row, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxHeight,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  width,
} from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type WidgetProps } from '../types';

const PrayerPanel = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;

  return (
    <Row modifiers={[fillMaxSize(), ...(c.transparent ? [] : [background(c.bg), cornerRadius(20)]), paddingAll(8)]}>
      {/* Sol blok */}
      <Box
        modifiers={[
          width(150),
          fillMaxHeight(),
          ...(c.transparent ? [] : [background(c.hero), cornerRadius(14)]),
          paddingAll(10),
        ]}
      >
        <Box contentAlignment="topStart" modifiers={[fillMaxSize()]}>
          <Text color={c.heroMuted} maxLines={1} style={{ fontSize: 12, fontWeight: '500' }}>
            {props.city}
          </Text>
        </Box>
        <Box contentAlignment="bottomStart" modifiers={[fillMaxSize()]}>
          {props.ready ? (
            <Column>
              <Text color={c.heroText} maxLines={1} style={{ fontSize: 15, fontWeight: '600' }}>
                {props.nextDative}
              </Text>
              <Text color={c.heroAccent} maxLines={1} style={{ fontSize: 28, fontWeight: '700' }}>
                {props.nextTime}
              </Text>
              <Text color={c.heroMuted} maxLines={1} style={{ fontSize: 11 }}>
                {props.hijri}
              </Text>
            </Column>
          ) : (
            <Text color={c.heroText} style={{ fontSize: 13 }}>
              Konum seçmek için uygulamayı açın
            </Text>
          )}
        </Box>
      </Box>

      {/* Sağ liste */}
      <Box contentAlignment="center" modifiers={[fillMaxSize(), padding(8, 0, 0, 0)]}>
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
    </Row>
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
