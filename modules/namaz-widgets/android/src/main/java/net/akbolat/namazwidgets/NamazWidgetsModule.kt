package net.akbolat.namazwidgets

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * JS köprüsü (src/widgets/android.ts):
 *  - setData(json): vakitleri, konumu ve renkleri kaydeder, tüm widget'ları yeniden çizer
 *  - reload(): kayıtlı veriyle yeniden çizer
 */
class NamazWidgetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NamazWidgets")

    Function("setData") { json: String ->
      appContext.reactContext?.let { context ->
        WidgetData.save(context, json)
        WidgetRenderer.updateAll(context)
      }
      Unit
    }

    Function("reload") {
      appContext.reactContext?.let { context -> WidgetRenderer.updateAll(context) }
      Unit
    }
  }
}
