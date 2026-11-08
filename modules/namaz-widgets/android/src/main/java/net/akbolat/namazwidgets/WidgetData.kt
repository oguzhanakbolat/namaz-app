package net.akbolat.namazwidgets

import android.content.Context
import android.graphics.Color
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/**
 * Uygulamanın (JS) gönderdiği widget verisi. SharedPreferences'ta JSON olarak saklanır;
 * widget'lar uygulama kapalıyken de buradan çizilir ve vakit hesabını kendileri yapar.
 *
 * JSON biçimi (src/widgets/android.ts → buildAndroidPayload):
 * {
 *   "city": "Çankaya",
 *   "labels":  ["İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"],
 *   "datives": ["Sabaha", "Güneşe", "Öğlene", "İkindiye", "Akşama", "Yatsıya"],
 *   "days": [{ "date": "2026-11-08", "times": ["05:53", ...6], "hijri": "...", "offset": 3 }],
 *   "palette": { "light": { ...renkler }, "dark": { ... } }
 * }
 */
class Palette(private val json: JSONObject?) {
  private fun c(key: String, fallback: String): Int =
    try {
      Color.parseColor(json?.optString(key, fallback)?.ifEmpty { fallback } ?: fallback)
    } catch (_: IllegalArgumentException) {
      Color.parseColor(fallback)
    }

  val transparent = json?.optBoolean("transparent", false) ?: false
  val bg = c("bg", "#FFFFFF")
  val surface = c("surface", "#F4F2EC")
  val text = c("text", "#1C2421")
  val muted = c("muted", "#6B736F")
  val hero = c("hero", "#0F6B5C")
  val heroText = c("heroText", "#FFFFFF")
  val heroMuted = c("heroMuted", "#D5E4E0")
  val heroAccent = c("heroAccent", "#F2C66D")
  val accent = c("accent", "#0F6B5C")
  val active = c("active", "#0F6B5C")
  val activeText = c("activeText", "#FFFFFF")
  val activeMuted = c("activeMuted", "#E4EEEB")
  val overlayText = c("overlayText", "#FFFFFF")
}

class Day(val date: String, val times: List<String>, val hijri: String, val offsetHours: Double)

/** Bir andaki durum: hangi vakitteyiz, sıradaki vakit ne zaman */
class PrayerState(
  /** Listede gösterilecek gün (ilçenin bugünü) */
  val day: Day,
  /** Şu anki vakit (0..5); gece yarısından sonra imsaka kadar Yatsı (5) */
  val current: Int,
  val next: Int,
  val currentStart: Long,
  val nextAt: Long,
  val nextTime: String,
)

class WidgetData(
  val city: String,
  val days: List<Day>,
  val labels: List<String>,
  val datives: List<String>,
  val light: Palette,
  val dark: Palette,
) {
  private class Moment(val at: Long, val dayIndex: Int, val prayer: Int)

  private val moments: List<Moment> by lazy {
    val out = ArrayList<Moment>()
    days.forEachIndexed { di, d ->
      d.times.forEachIndexed { pi, t ->
        val at = epoch(d.date, t, d.offsetHours)
        if (at != null) out.add(Moment(at, di, pi))
      }
    }
    out.sortBy { it.at }
    out
  }

  val ready: Boolean get() = city.isNotEmpty() && days.isNotEmpty()

  fun stateAt(now: Long): PrayerState? {
    if (!ready) return null
    val nextIdx = moments.indexOfFirst { it.at > now }
    if (nextIdx < 0) return null
    val next = moments[nextIdx]
    val cur = if (nextIdx > 0) moments[nextIdx - 1] else null
    val offset = days[next.dayIndex].offsetHours
    val today = cityDate(now, offset)
    val day = days.firstOrNull { it.date == today } ?: days[next.dayIndex]
    return PrayerState(
      day = day,
      current = cur?.prayer ?: 5,
      next = next.prayer,
      currentStart = cur?.at ?: (next.at - 3_600_000L),
      nextAt = next.at,
      nextTime = days[next.dayIndex].times[next.prayer],
    )
  }

  /** Widget'ın kendini yenilemesi gereken bir sonraki an: sıradaki vakit girişi ya da ilçede gece yarısı */
  fun nextRefreshAfter(now: Long): Long? {
    var best: Long? = moments.firstOrNull { it.at > now }?.at
    for (d in days) {
      val midnight = epoch(d.date, "00:00", d.offsetHours) ?: continue
      if (midnight > now && (best == null || midnight < best)) best = midnight
    }
    return best
  }

  companion object {
    private const val PREFS = "namaz_widgets"
    private const val KEY = "data"

    fun save(context: Context, json: String) {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
    }

    fun load(context: Context): WidgetData? {
      val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null) ?: return null
      return try {
        parse(JSONObject(raw))
      } catch (_: Exception) {
        null
      }
    }

    fun parse(o: JSONObject): WidgetData {
      val days = ArrayList<Day>()
      val arr = o.optJSONArray("days")
      if (arr != null) {
        for (i in 0 until arr.length()) {
          val d = arr.optJSONObject(i) ?: continue
          val ts = d.optJSONArray("times") ?: continue
          if (ts.length() < 6) continue
          days.add(
            Day(
              date = d.optString("date"),
              times = (0 until 6).map { ts.optString(it) },
              hijri = d.optString("hijri"),
              offsetHours = d.optDouble("offset", 3.0),
            ),
          )
        }
      }
      fun strings(key: String, fallback: List<String>): List<String> {
        val a = o.optJSONArray(key) ?: return fallback
        if (a.length() < 6) return fallback
        return (0 until 6).map { a.optString(it) }
      }
      val palette = o.optJSONObject("palette")
      return WidgetData(
        city = o.optString("city"),
        days = days,
        labels = strings("labels", listOf("İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı")),
        datives = strings("datives", listOf("Sabaha", "Güneşe", "Öğleye", "İkindiye", "Akşama", "Yatsıya")),
        light = Palette(palette?.optJSONObject("light")),
        dark = Palette(palette?.optJSONObject("dark") ?: palette?.optJSONObject("light")),
      )
    }

    /** "YYYY-MM-DD" + "HH:MM" (ilçe saati, UTC+offset) → epoch ms */
    fun epoch(date: String, hhmm: String, offsetHours: Double): Long? {
      val dp = date.split("-")
      val tp = hhmm.trim().split(":")
      if (dp.size != 3 || tp.size < 2) return null
      val y = dp[0].toIntOrNull() ?: return null
      val m = dp[1].toIntOrNull() ?: return null
      val d = dp[2].toIntOrNull() ?: return null
      val h = tp[0].toIntOrNull() ?: return null
      val mi = tp[1].take(2).toIntOrNull() ?: return null
      val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
      cal.clear()
      cal.set(y, m - 1, d, h, mi, 0)
      return cal.timeInMillis - (offsetHours * 3_600_000).toLong()
    }

    /** İlçenin yerel tarihine göre bugün (YYYY-MM-DD) */
    fun cityDate(now: Long, offsetHours: Double): String {
      val f = SimpleDateFormat("yyyy-MM-dd", Locale.US)
      f.timeZone = TimeZone.getTimeZone("UTC")
      return f.format(now + (offsetHours * 3_600_000).toLong())
    }
  }
}
