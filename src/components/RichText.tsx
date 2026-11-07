import { Text, type TextStyle, type StyleProp } from 'react-native';

/**
 * Basit vurgu desteği: **kalın** ve *italik*.
 * Panelde metin alanına "**Bizi aldatan, bizden değildir.**" yazılırsa kalın gösterilir.
 */
export function RichText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return (
            <Text key={i} style={{ fontWeight: '700' }}>
              {p.slice(2, -2)}
            </Text>
          );
        }
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
          return (
            <Text key={i} style={{ fontStyle: 'italic' }}>
              {p.slice(1, -1)}
            </Text>
          );
        }
        return p;
      })}
    </Text>
  );
}
