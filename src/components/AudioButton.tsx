import Ionicons from '@expo/vector-icons/Ionicons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, space, useTheme } from '@/theme';

let audioModeSet = false;

/** İçeriğin sesli okunuşu için oynat / durdur düğmesi */
export function AudioButton({ url }: { url: string }) {
  const t = useTheme();
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!audioModeSet) {
      audioModeSet = true;
      // iPhone sessiz moddayken de okunuş duyulsun
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
  }, []);

  // Bitince başa sar (expo-audio otomatik sarmaz)
  useEffect(() => {
    if (status.didJustFinish) player.seekTo(0);
  }, [status.didJustFinish, player]);

  const toggle = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'Okunuşu durdur' : 'Okunuşu dinle'}
      hitSlop={8}
      style={({ pressed }) => [styles.btn, { backgroundColor: t.primarySoft, opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons name={status.playing ? 'pause' : 'play'} size={14} color={t.primary} />
      <Text style={[styles.text, { color: t.primary }]}>{status.playing ? 'Durdur' : 'Dinle'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space(3),
    paddingVertical: space(1.5),
    borderRadius: radius.pill,
  },
  text: { fontSize: 13, fontWeight: '700' },
});
