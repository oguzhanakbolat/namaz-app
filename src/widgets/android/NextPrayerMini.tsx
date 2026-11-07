/**
 * Android — "Sıradaki Vakit (Mini)" 1x1, her zaman şeffaf: yalnızca "Akşama 17:47".
 * Arka plan çizilmez; widget doğrudan duvar kâğıdının üzerinde durur. Yazı rengi Widget Ayarları'ndan (beyaz/siyah).
 */
import { Column, Text } from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type WidgetProps } from '../types';

const NextPrayerMini = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const c = env.colorScheme === 'dark' ? props.palette.dark : props.palette.light;
  return (
    <Column horizontalAlignment="center" verticalArrangement="center" modifiers={[fillMaxSize()]}>
      <Text color={c.overlayText} maxLines={1} style={{ fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
        {props.ready ? props.nextDative : 'Vakit'}
      </Text>
      <Text color={c.overlayText} maxLines={1} style={{ fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
        {props.ready ? props.nextTime : '--:--'}
      </Text>
    </Column>
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
