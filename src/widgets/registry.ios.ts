import DailyTimes from './ios/DailyTimes';
import NextPrayer from './ios/NextPrayer';
import NextPrayerMini from './ios/NextPrayerMini';
import PrayerPanel from './ios/PrayerPanel';
import PrayerStrip from './ios/PrayerStrip';

// Oluşturulamayan widget'lar (null) atlanır
export const widgets = [NextPrayer, NextPrayerMini, DailyTimes, PrayerPanel, PrayerStrip].filter((w) => w !== null);
