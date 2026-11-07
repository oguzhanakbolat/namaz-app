/**
 * Android — "Sıradaki Vakit" (2x2).
 * Android widget'larında zaman çizelgesi olmadığı için canlı geri sayım yerine sıradaki vaktin saati gösterilir;
 * içerik uygulama açıldığında ve arka plan göreviyle (en sık ~15 dk'da bir) güncellenir.
 * Renkler props.palette'ten gelir (uygulamadaki Widget Ayarları).
 *
 * Yerleşim notu: Android widget'larında (Glance) spaceBetween/weight yok. "Üstte konum, altta vakit" düzeni
 * üst üste iki Box katmanıyla (biri üste, biri alta hizalı) kurulur.
 *
 * Widget fonksiyonu ayrı bir ortamda çalışır: dışarıdaki sabitlere erişemez, yalnızca Expo UI bileşenleri kullanılabilir.
 */
import { Box, Column, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type WidgetProps } from '../types';

const NextPrayer = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;
  const frameMods = [fillMaxSize(), ...(c.transparent ? [] : [background(c.hero), cornerRadius(20)]), paddingAll(14)];

  if (!props.ready) {
    return (
      <Box contentAlignment="centerStart" modifiers={frameMods}>
        <Column>
          <Text color={c.heroText} style={{ fontSize: 15, fontWeight: '700' }}>
            Namaz Vakti
          </Text>
          <Text color={c.heroMuted} style={{ fontSize: 12 }}>
            Konum seçmek için uygulamayı açın
          </Text>
        </Column>
      </Box>
    );
  }

  const current = props.current >= 0 ? props.prayers[props.current] : null;

  return (
    <Box modifiers={frameMods}>
      {/* Üst: konum */}
      <Box contentAlignment="topStart" modifiers={[fillMaxSize()]}>
        <Text color={c.heroMuted} maxLines={1} style={{ fontSize: 12, fontWeight: '500' }}>
          {props.city}
        </Text>
      </Box>
      {/* Alt: sıradaki vakit */}
      <Box contentAlignment="bottomStart" modifiers={[fillMaxSize()]}>
        <Column>
          <Text color={c.heroText} maxLines={1} style={{ fontSize: 16, fontWeight: '600' }}>
            {props.nextDative}
          </Text>
          <Text color={c.heroAccent} maxLines={1} style={{ fontSize: 36, fontWeight: '700' }}>
            {props.nextTime}
          </Text>
          <Text color={c.heroMuted} maxLines={1} style={{ fontSize: 11 }}>
            {current ? `Şu an ${current.label} vakti` : props.dateLabel}
          </Text>
        </Column>
      </Box>
    </Box>
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
