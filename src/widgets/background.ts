/**
 * Widget'ları ve vakit alarmlarını uygulama kapalıyken de güncel tutan arka plan görevi.
 *  - Alarmlar: iOS'ta aynı anda en fazla ~60 alarm kurulabildiği için ileri günlerin alarmları buradan eklenir.
 *  - Android: widget'lar kendiliğinden yenilenemediği için asıl güncelleme yolu budur (sistem en sık ~15 dk'da bir çalıştırır).
 *  - iOS: zaman çizelgesi bitmeden (uygulama ~10 gün açılmazsa) yenilemek için; ne zaman çalışacağına sistem karar verir.
 * Görev cihazdaki önbellekten çalışır; internete çıkmaz.
 *
 * Bu dosya uygulama açılışında (src/app/_layout.tsx) içe aktarılmalıdır: görev tanımı global kapsamda olmalı.
 */
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { alarmsAvailable, syncAlarms } from '@/lib/alarms';
import { loadSettings } from '@/lib/settings';
import { KEYS, storage, type Cached } from '@/lib/storage';
import type { DayTimes, SavedLocation } from '@/lib/types';
import { syncWidgets, widgetsAvailable } from './sync';

const TASK = 'namaz-widgets-refresh';

const supported =
  Platform.OS !== 'web' &&
  !!requireOptionalNativeModule('ExpoTaskManager') &&
  !!requireOptionalNativeModule('ExpoBackgroundTask');

/* eslint-disable @typescript-eslint/no-require-imports */
const TaskManager = supported ? (require('expo-task-manager') as typeof import('expo-task-manager')) : null;
const BackgroundTask = supported ? (require('expo-background-task') as typeof import('expo-background-task')) : null;
/* eslint-enable @typescript-eslint/no-require-imports */

export async function refreshWidgetsFromCache() {
  const location = await storage.get<SavedLocation>(KEYS.location);
  const times = location ? await storage.get<Cached<DayTimes[]>>(KEYS.times(location.cityId)) : null;
  const settings = await loadSettings();
  syncWidgets(times?.data, location?.cityName, settings.widget);
  await syncAlarms(times?.data, location?.cityName, settings.alarms);
}

if (TaskManager && BackgroundTask) {
  TaskManager.defineTask(TASK, async () => {
    try {
      await refreshWidgetsFromCache();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/** Arka plan görevini kaydeder (birden çok çağrılması sorun değildir) */
export async function registerWidgetBackgroundTask() {
  if (!TaskManager || !BackgroundTask || (!widgetsAvailable() && !alarmsAvailable())) return;
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
    if (!(await TaskManager.isTaskRegisteredAsync(TASK))) {
      await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 15 });
    }
  } catch (e) {
    console.warn('[widget] arka plan görevi kaydedilemedi', e);
  }
}
