/**
 * Android widget galerisinde (ana ekrana widget eklerken) her widget için önizleme görseli gösterir.
 *
 * expo-widgets bu ayarı sunmadığı için, prebuild sırasında:
 *  1. assets/widget-previews/<widget_adi>.png dosyalarını android/app/src/main/res/drawable-nodpi/ altına kopyalar
 *  2. expo-widgets'ın ürettiği res/xml/<widget_adi>_info.xml dosyasına android:previewImage ekler
 *
 * withFinalizedMod kullanılır: tüm diğer eklentilerden (expo-widgets dahil) sonra çalışır.
 * android/ klasörüne elle dokunulmaz; her prebuild'de yeniden uygulanır.
 *
 * app.json:
 *   ["./plugins/withWidgetPreviews", { "dir": "./assets/widget-previews" }]
 * Görsel adı, widget adının Android kaynak adıdır: NextPrayer -> next_prayer.png, NextPrayerMini -> next_prayer_mini.png
 */
const fs = require('fs');
const path = require('path');
const { withFinalizedMod } = require('expo/config-plugins');

// expo-widgets ile aynı adlandırma (plugin/build/android/resourceNames.js)
const toAndroidResourceName = (name) => {
  const r = name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return /^[a-z]/.test(r) ? r : `widget_${r}`;
};

function getWidgetNames(config) {
  const entry = (config.plugins || []).find((p) => Array.isArray(p) && p[0] === 'expo-widgets');
  const widgets = entry?.[1]?.widgets || [];
  return widgets.filter((w) => w.android !== null).map((w) => w.name);
}

const withWidgetPreviews = (config, props = {}) => {
  const dir = props.dir || './assets/widget-previews';

  return withFinalizedMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const resDir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      const drawableDir = path.join(resDir, 'drawable-nodpi');
      fs.mkdirSync(drawableDir, { recursive: true });

      for (const name of getWidgetNames(cfg)) {
        const res = toAndroidResourceName(name);
        const src = path.join(projectRoot, dir, `${res}.png`);
        const xmlPath = path.join(resDir, 'xml', `${res}_info.xml`);

        if (!fs.existsSync(src)) {
          console.warn(`[withWidgetPreviews] ${name}: önizleme görseli yok (${path.join(dir, `${res}.png`)})`);
          continue;
        }
        if (!fs.existsSync(xmlPath)) {
          console.warn(`[withWidgetPreviews] ${name}: ${res}_info.xml bulunamadı (expo-widgets üretmemiş)`);
          continue;
        }

        const drawable = `widget_preview_${res}`;
        fs.copyFileSync(src, path.join(drawableDir, `${drawable}.png`));

        let xml = fs.readFileSync(xmlPath, 'utf8');
        xml = xml.replace(/\s*android:previewImage="[^"]*"/, '');
        xml = xml.replace('<appwidget-provider', `<appwidget-provider\n  android:previewImage="@drawable/${drawable}"`);
        fs.writeFileSync(xmlPath, xml);
      }
      return cfg;
    },
  ]);
};

module.exports = withWidgetPreviews;
