/**
 * Android — "Vakit Şeridi" (4x1). Altı vakit yan yana, şu anki vakit vurgulu.
 * Renkler props.palette'ten gelir (uygulamadaki Widget Ayarları).
 *
 * Yerleşim notu: Android widget'larında (Glance) spaceEvenly/weight yok. Hücreler eşit sabit genişlikte
 * ve ortalanmış bir satır olarak dizilir; widget genişlediğinde iki yanda eşit boşluk kalır.
 * Hücre genişliği (CELL) 4 hücrelik en dar ana ekranlara (~320dp) sığacak şekilde seçildi.
 */
import { Box, Column, Row, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, padding, width } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type WidgetProps } from '../types';

const PrayerStrip = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;
  const CELL = 50;

  return (
    <Box
      contentAlignment="center"
      modifiers={[fillMaxSize(), ...(c.transparent ? [] : [background(c.bg), cornerRadius(18)]), padding(4, 4, 4, 4)]}
    >
      <Row verticalAlignment="center">
        {props.prayers.map((p, i) => {
          const active = i === props.current;
          return (
            <Box key={p.label} contentAlignment="center" modifiers={[width(CELL + 4)]}>
              <Column
                horizontalAlignment="center"
                modifiers={[
                  width(CELL),
                  ...(active ? [background(c.active), cornerRadius(12)] : []),
                  padding(0, 6, 0, 6),
                ]}
              >
                <Text
                  color={active ? c.activeMuted : c.muted}
                  maxLines={1}
                  style={{ fontSize: 11, fontWeight: '500', textAlign: 'center' }}
                >
                  {p.label}
                </Text>
                <Text
                  color={active ? c.activeText : c.text}
                  maxLines={1}
                  style={{ fontSize: 14, fontWeight: '700', textAlign: 'center' }}
                >
                  {p.time}
                </Text>
              </Column>
            </Box>
          );
        })}
      </Row>
    </Box>
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
