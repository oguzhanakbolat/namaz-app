import DailyTimes from './android/DailyTimes';
import NextPrayer from './android/NextPrayer';
import NextPrayerMini from './android/NextPrayerMini';
import PrayerPanel from './android/PrayerPanel';
import PrayerStrip from './android/PrayerStrip';

// Oluşturulamayan widget'lar (null) atlanır
export const widgets = [NextPrayer, NextPrayerMini, DailyTimes, PrayerPanel, PrayerStrip].filter((w) => w !== null);
