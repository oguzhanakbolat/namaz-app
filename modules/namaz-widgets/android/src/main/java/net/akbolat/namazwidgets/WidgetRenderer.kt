package net.akbolat.namazwidgets

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Build
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews

/** Widget türleri: her biri bir AppWidgetProvider sınıfı ve bir yerleşim (layout) */
enum class WidgetKind(val provider: Class<*>) {
  NEXT(NextPrayerWidget::class.java),
  MINI(NextPrayerMiniWidget::class.java),
  DAILY(DailyTimesWidget::class.java),
  PANEL(PrayerPanelWidget::class.java),
  STRIP(PrayerStripWidget::class.java),
  CARD(PrayerCardWidget::class.java),
}

/**
 * Widget'ları çizer ve bir sonraki vakit girişinde / gece yarısında kendini yeniden çizmek için alarm kurar.
 *  - Geri sayım Android'in Chronometer bileşeniyle yapılır: sistem saniye saniye kendisi işletir,
 *    uygulama kapalıyken de çalışır.
 *  - Renkler: Android 12+ açık/koyu renkleri birlikte verir (setColorInt), sistem temaya göre seçer.
 *    Daha eski sürümlerde o anki temaya göre çizilir.
 */
object WidgetRenderer {
  const val ACTION_TICK = "net.akbolat.namazwidgets.TICK"
  const val ACTION_MINUTE = "net.akbolat.namazwidgets.MINUTE"
  private const val TICK_REQUEST = 4207
  private const val MINUTE_REQUEST = 4208

  fun updateAll(context: Context) {
    val data = WidgetData.load(context)
    val manager = AppWidgetManager.getInstance(context)
    var any = false
    for (kind in WidgetKind.values()) {
      val ids = manager.getAppWidgetIds(ComponentName(context, kind.provider))
      if (ids.isEmpty()) continue
      any = true
      for (id in ids) manager.updateAppWidget(id, render(context, kind, data))
    }
    if (any) scheduleNext(context, data) else cancelTick(context)
    scheduleMinute(context, data)
  }

  /** Yalnızca Mini widget'ları (her dakika dönümünde, ekran açıkken) */
  fun updateMini(context: Context) {
    val data = WidgetData.load(context)
    val manager = AppWidgetManager.getInstance(context)
    val ids = manager.getAppWidgetIds(ComponentName(context, WidgetKind.MINI.provider))
    for (id in ids) manager.updateAppWidget(id, render(context, WidgetKind.MINI, data))
    scheduleMinute(context, data)
  }

  fun update(context: Context, kind: WidgetKind, ids: IntArray) {
    val data = WidgetData.load(context)
    val manager = AppWidgetManager.getInstance(context)
    for (id in ids) manager.updateAppWidget(id, render(context, kind, data))
    scheduleNext(context, data)
    if (kind == WidgetKind.MINI) scheduleMinute(context, data)
  }

  // ------------------------------------------------------------------ zamanlama

  private fun tickIntent(context: Context): PendingIntent {
    val intent = Intent(context, WidgetUpdateReceiver::class.java).setAction(ACTION_TICK)
    return PendingIntent.getBroadcast(
      context,
      TICK_REQUEST,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun minuteIntent(context: Context): PendingIntent {
    val intent = Intent(context, WidgetUpdateReceiver::class.java).setAction(ACTION_MINUTE)
    return PendingIntent.getBroadcast(
      context,
      MINUTE_REQUEST,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  /**
   * Mini widget'taki "01:12" yazısı için bir sonraki dakika dönümünde yenileme.
   * RTC (uyandırmayan) alarm: telefon uykudayken çalışmaz, ekran açılınca hemen çalışır; pil harcamaz.
   */
  private fun scheduleMinute(context: Context, data: WidgetData?) {
    val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val pi = minuteIntent(context)
    val manager = AppWidgetManager.getInstance(context)
    val hasMini = manager.getAppWidgetIds(ComponentName(context, WidgetKind.MINI.provider)).isNotEmpty()
    val now = System.currentTimeMillis()
    val s = if (hasMini) data?.stateAt(now) else null
    if (s == null) {
      am.cancel(pi)
      return
    }
    // Kalan dakika yukarı yuvarlanır; yazı, kalan süre bir sonraki tam dakikaya indiğinde değişir
    val left = s.nextAt - now
    val step = left % 60_000L
    val at = now + (if (step == 0L) 60_000L else step) + 200
    try {
      val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
      if (exact) am.setExact(AlarmManager.RTC, at, pi) else am.set(AlarmManager.RTC, at, pi)
    } catch (_: SecurityException) {
      am.set(AlarmManager.RTC, at, pi)
    }
  }

  /** Kalan süre "01:21" (saat:dakika, dakika yukarı yuvarlanır) */
  fun remainingText(nextAt: Long, now: Long): String {
    val mins = ((nextAt - now + 59_999L) / 60_000L).coerceAtLeast(0L)
    return String.format(java.util.Locale.US, "%02d:%02d", mins / 60, mins % 60)
  }

  private fun cancelTick(context: Context) {
    (context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager)?.cancel(tickIntent(context))
  }

  private fun scheduleNext(context: Context, data: WidgetData?) {
    val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val now = System.currentTimeMillis()
    val at = data?.nextRefreshAfter(now)?.plus(500) ?: return cancelTick(context)
    val pi = tickIntent(context)
    try {
      val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
      if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
      else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
    } catch (_: SecurityException) {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
    }
  }

  // ------------------------------------------------------------------ çizim

  private fun isNight(context: Context) =
    (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

  /** Açık/koyu renk: Android 12+ ikisini birden verir; eskilerde o anki temaya göre seçilir */
  private class Painter(private val rv: RemoteViews, private val night: Boolean) {
    fun color(id: Int, method: String, light: Int, dark: Int) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) rv.setColorInt(id, method, light, dark)
      else rv.setInt(id, method, if (night) dark else light)
    }

    fun text(id: Int, light: Int, dark: Int) = color(id, "setTextColor", light, dark)

    /** Yuvarlak köşeli arka plan (beyaz şekil + renk filtresi) */
    fun fill(id: Int, light: Int, dark: Int) = color(id, "setColorFilter", light, dark)
  }

  private fun openAppIntent(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    launch.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
    return PendingIntent.getActivity(
      context,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun setCountdown(rv: RemoteViews, id: Int, nextAt: Long) {
    val base = SystemClock.elapsedRealtime() + (nextAt - System.currentTimeMillis())
    rv.setChronometer(id, base, null, true)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) rv.setChronometerCountDown(id, true)
  }

  fun render(context: Context, kind: WidgetKind, data: WidgetData?): RemoteViews {
    val night = isNight(context)
    val state = data?.stateAt(System.currentTimeMillis())
    val rv = when (kind) {
      WidgetKind.NEXT -> renderNext(context, data, state, night)
      WidgetKind.MINI -> renderMini(context, data, state, night)
      WidgetKind.DAILY -> renderDaily(context, data, state, night)
      WidgetKind.PANEL -> renderPanel(context, data, state, night)
      WidgetKind.STRIP -> renderStrip(context, data, state, night)
      WidgetKind.CARD -> renderCard(context, data, state, night)
    }
    openAppIntent(context)?.let { rv.setOnClickPendingIntent(R.id.nw_root, it) }
    return rv
  }

  private fun background(p: Painter, rv: RemoteViews, id: Int, data: WidgetData?, hero: Boolean) {
    val l = data?.light ?: Palette(null)
    val d = data?.dark ?: Palette(null)
    if (l.transparent && (data?.dark?.transparent ?: true)) {
      rv.setViewVisibility(id, View.GONE)
      return
    }
    rv.setViewVisibility(id, View.VISIBLE)
    if (hero) p.fill(id, l.hero, d.hero) else p.fill(id, l.bg, d.bg)
  }

  // --- Sıradaki Vakit (2x2): konum, "Akşama", canlı geri sayım, vaktin saati
  private fun renderNext(context: Context, data: WidgetData?, s: PrayerState?, night: Boolean): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.nw_next_prayer)
    val p = Painter(rv, night)
    val l = data?.light ?: Palette(null)
    val d = data?.dark ?: Palette(null)
    background(p, rv, R.id.nw_bg, data, hero = true)
    p.text(R.id.nw_city, l.heroMuted, d.heroMuted)
    p.text(R.id.nw_title, l.heroText, d.heroText)
    p.text(R.id.nw_timer, l.heroAccent, d.heroAccent)
    p.text(R.id.nw_sub, l.heroMuted, d.heroMuted)

    if (data == null || s == null) {
      rv.setTextViewText(R.id.nw_city, "Namaz Vakti")
      rv.setTextViewText(R.id.nw_title, "Konum seçmek için uygulamayı açın")
      rv.setViewVisibility(R.id.nw_timer, View.GONE)
      rv.setViewVisibility(R.id.nw_sub, View.GONE)
      return rv
    }
    rv.setTextViewText(R.id.nw_city, data.city)
    rv.setTextViewText(R.id.nw_title, data.datives[s.next])
    rv.setViewVisibility(R.id.nw_timer, View.VISIBLE)
    setCountdown(rv, R.id.nw_timer, s.nextAt)
    rv.setViewVisibility(R.id.nw_sub, View.VISIBLE)
    rv.setTextViewText(R.id.nw_sub, "${data.labels[s.next]} ${s.nextTime}")
    return rv
  }

  // --- Mini (1x1, şeffaf): "Akşama" + kalan süre ("01:12"; dakikada bir yenilenir)
  private fun renderMini(context: Context, data: WidgetData?, s: PrayerState?, night: Boolean): RemoteViews {
    val l = data?.light ?: Palette(null)
    val d = data?.dark ?: Palette(null)
    val blackText = (if (night) d.overlayText else l.overlayText) == android.graphics.Color.parseColor("#111111")
    val rv = RemoteViews(context.packageName, if (blackText) R.layout.nw_mini_dark_text else R.layout.nw_mini)
    if (data == null || s == null) {
      rv.setTextViewText(R.id.nw_title, "Vakit")
      rv.setTextViewText(R.id.nw_time, "--:--")
      return rv
    }
    rv.setTextViewText(R.id.nw_title, data.datives[s.next])
    rv.setTextViewText(R.id.nw_time, remainingText(s.nextAt, System.currentTimeMillis()))
    return rv
  }

  /** Vakit listesi satırları (Günün Vakitleri, Vakit Paneli) */
  private fun fillList(context: Context, rv: RemoteViews, night: Boolean, data: WidgetData, s: PrayerState) {
    rv.removeAllViews(R.id.nw_list)
    for (i in 0 until 6) {
      val active = i == s.current
      val row = RemoteViews(context.packageName, R.layout.nw_row_fill)
      val rp = Painter(row, night)
      row.setTextViewText(R.id.nw_label, data.labels[i])
      row.setTextViewText(R.id.nw_time, s.day.times[i])
      if (active) {
        row.setViewVisibility(R.id.nw_row_bg, View.VISIBLE)
        rp.fill(R.id.nw_row_bg, data.light.active, data.dark.active)
        rp.text(R.id.nw_label, data.light.activeText, data.dark.activeText)
        rp.text(R.id.nw_time, data.light.activeText, data.dark.activeText)
      } else {
        row.setViewVisibility(R.id.nw_row_bg, View.GONE)
        rp.text(R.id.nw_label, data.light.muted, data.dark.muted)
        rp.text(R.id.nw_time, data.light.text, data.dark.text)
      }
      rv.addView(R.id.nw_list, row)
    }
  }

  // --- Günün Vakitleri (2x2)
  private fun renderDaily(context: Context, data: WidgetData?, s: PrayerState?, night: Boolean): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.nw_daily_times)
    val p = Painter(rv, night)
    background(p, rv, R.id.nw_bg, data, hero = false)
    if (data == null || s == null) {
      rv.setViewVisibility(R.id.nw_empty, View.VISIBLE)
      rv.setViewVisibility(R.id.nw_list, View.GONE)
      val l = data?.light ?: Palette(null)
      val d = data?.dark ?: Palette(null)
      p.text(R.id.nw_empty, l.muted, d.muted)
      return rv
    }
    rv.setViewVisibility(R.id.nw_empty, View.GONE)
    rv.setViewVisibility(R.id.nw_list, View.VISIBLE)
    fillList(context, rv, night, data, s)
    return rv
  }

  // --- Vakit Paneli (4x2): solda sıradaki vakit + geri sayım, sağda liste
  private fun renderPanel(context: Context, data: WidgetData?, s: PrayerState?, night: Boolean): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.nw_prayer_panel)
    val p = Painter(rv, night)
    val l = data?.light ?: Palette(null)
    val d = data?.dark ?: Palette(null)
    background(p, rv, R.id.nw_bg, data, hero = false)
    if (l.transparent) rv.setViewVisibility(R.id.nw_hero_bg, View.GONE)
    else p.fill(R.id.nw_hero_bg, l.hero, d.hero)
    p.text(R.id.nw_city, l.heroMuted, d.heroMuted)
    p.text(R.id.nw_title, l.heroText, d.heroText)
    p.text(R.id.nw_timer, l.heroAccent, d.heroAccent)
    p.text(R.id.nw_sub, l.heroMuted, d.heroMuted)

    if (data == null || s == null) {
      rv.setTextViewText(R.id.nw_city, "Namaz Vakti")
      rv.setTextViewText(R.id.nw_title, "Konum seçmek için uygulamayı açın")
      rv.setViewVisibility(R.id.nw_timer, View.GONE)
      rv.setViewVisibility(R.id.nw_sub, View.GONE)
      rv.removeAllViews(R.id.nw_list)
      return rv
    }
    rv.setTextViewText(R.id.nw_city, data.city)
    rv.setTextViewText(R.id.nw_title, data.datives[s.next])
    rv.setViewVisibility(R.id.nw_timer, View.VISIBLE)
    setCountdown(rv, R.id.nw_timer, s.nextAt)
    rv.setViewVisibility(R.id.nw_sub, View.VISIBLE)
    rv.setTextViewText(R.id.nw_sub, s.day.hijri.ifEmpty { "${data.labels[s.next]} ${s.nextTime}" })
    fillList(context, rv, night, data, s)
    return rv
  }

  // --- Vakit Şeridi (4x1): altı vakit yan yana, şu anki vurgulu
  private fun renderStrip(context: Context, data: WidgetData?, s: PrayerState?, night: Boolean): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.nw_prayer_strip)
    val p = Painter(rv, night)
    background(p, rv, R.id.nw_bg, data, hero = false)
    rv.removeAllViews(R.id.nw_list)
    if (data == null || s == null) {
      rv.setViewVisibility(R.id.nw_empty, View.VISIBLE)
      val l = data?.light ?: Palette(null)
      val d = data?.dark ?: Palette(null)
      p.text(R.id.nw_empty, l.muted, d.muted)
      return rv
    }
    rv.setViewVisibility(R.id.nw_empty, View.GONE)
    for (i in 0 until 6) {
      val active = i == s.current
      val cell = RemoteViews(context.packageName, R.layout.nw_cell)
      val cp = Painter(cell, night)
      cell.setTextViewText(R.id.nw_label, data.labels[i])
      cell.setTextViewText(R.id.nw_time, s.day.times[i])
      if (active) {
        cell.setViewVisibility(R.id.nw_row_bg, View.VISIBLE)
        cp.fill(R.id.nw_row_bg, data.light.active, data.dark.active)
        cp.text(R.id.nw_label, data.light.activeMuted, data.dark.activeMuted)
        cp.text(R.id.nw_time, data.light.activeText, data.dark.activeText)
      } else {
        cell.setViewVisibility(R.id.nw_row_bg, View.GONE)
        cp.text(R.id.nw_label, data.light.muted, data.dark.muted)
        cp.text(R.id.nw_time, data.light.text, data.dark.text)
      }
      rv.addView(R.id.nw_list, cell)
    }
    return rv
  }

  // --- Vakit Şeridi (4x1; iOS'ta orta boy): üstte konum + hicri tarih, sağda "Öğleye" ve canlı geri sayım;
  //     altta altı vakit kutucuklarda, şu anki vurgulu
  private fun renderCard(context: Context, data: WidgetData?, s: PrayerState?, night: Boolean): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.nw_prayer_card)
    val p = Painter(rv, night)
    val l = data?.light ?: Palette(null)
    val d = data?.dark ?: Palette(null)
    background(p, rv, R.id.nw_bg, data, hero = false)
    p.text(R.id.nw_city, l.text, d.text)
    p.text(R.id.nw_sub, l.muted, d.muted)
    p.text(R.id.nw_title, l.muted, d.muted)
    p.text(R.id.nw_timer, l.accent, d.accent)
    rv.removeAllViews(R.id.nw_list)

    if (data == null || s == null) {
      rv.setTextViewText(R.id.nw_city, data?.city?.ifEmpty { null } ?: "Namaz Vakti")
      rv.setTextViewText(R.id.nw_sub, context.getString(R.string.nw_empty))
      rv.setViewVisibility(R.id.nw_next_box, View.GONE)
      return rv
    }
    rv.setTextViewText(R.id.nw_city, data.city)
    rv.setTextViewText(R.id.nw_sub, s.day.hijri)
    rv.setViewVisibility(R.id.nw_next_box, View.VISIBLE)
    rv.setTextViewText(R.id.nw_title, data.datives[s.next])
    setCountdown(rv, R.id.nw_timer, s.nextAt)

    for (i in 0 until 6) {
      val active = i == s.current
      val cell = RemoteViews(context.packageName, R.layout.nw_cell_fill)
      val cp = Painter(cell, night)
      cell.setTextViewText(R.id.nw_label, data.labels[i])
      cell.setTextViewText(R.id.nw_time, s.day.times[i])
      when {
        active -> {
          cell.setViewVisibility(R.id.nw_row_bg, View.VISIBLE)
          cp.fill(R.id.nw_row_bg, data.light.active, data.dark.active)
          cp.text(R.id.nw_label, data.light.activeMuted, data.dark.activeMuted)
          cp.text(R.id.nw_time, data.light.activeText, data.dark.activeText)
        }
        else -> {
          // Şeffaf temada kutucuk zemini yok (iOS ile aynı)
          if (data.light.transparent) cell.setViewVisibility(R.id.nw_row_bg, View.GONE)
          else {
            cell.setViewVisibility(R.id.nw_row_bg, View.VISIBLE)
            cp.fill(R.id.nw_row_bg, data.light.surface, data.dark.surface)
          }
          cp.text(R.id.nw_label, data.light.muted, data.dark.muted)
          cp.text(R.id.nw_time, data.light.text, data.dark.text)
        }
      }
      rv.addView(R.id.nw_list, cell)
    }
    return rv
  }
}
