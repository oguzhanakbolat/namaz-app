package net.akbolat.namazwidgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle

/** Ortak widget sağlayıcısı: sistem güncelleme istediğinde veya boyut değişince yeniden çizer */
abstract class BaseWidget(private val kind: WidgetKind) : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    WidgetRenderer.update(context, kind, ids)
  }

  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) {
    WidgetRenderer.update(context, kind, intArrayOf(id))
  }

  override fun onDisabled(context: Context) {
    // Bu türden son widget kaldırıldı: diğer türler varsa zamanlamayı onlar sürdürür
    WidgetRenderer.updateAll(context)
  }
}

class NextPrayerWidget : BaseWidget(WidgetKind.NEXT)
class NextPrayerMiniWidget : BaseWidget(WidgetKind.MINI)
class DailyTimesWidget : BaseWidget(WidgetKind.DAILY)
class PrayerPanelWidget : BaseWidget(WidgetKind.PANEL)
class PrayerStripWidget : BaseWidget(WidgetKind.STRIP)
class PrayerCardWidget : BaseWidget(WidgetKind.CARD)

/**
 * Widget'ları yeniden çizen olaylar:
 *  - TICK: vakit girişi / gece yarısı alarmı (WidgetRenderer.scheduleNext)
 *  - MINUTE: Mini widget'taki kalan dakikanın yenilenmesi (yalnızca ekran açıkken)
 *  - Açılış, saat/saat dilimi değişimi, uygulama güncellemesi: geri sayımın dayanağı (elapsedRealtime) değişir
 */
class WidgetUpdateReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val pending = goAsync()
    try {
      if (intent.action == WidgetRenderer.ACTION_MINUTE) WidgetRenderer.updateMini(context)
      else WidgetRenderer.updateAll(context)
    } finally {
      pending.finish()
    }
  }
}
