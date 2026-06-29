import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({
  children,
  delay = 0,
  distance = 10,
  style,
}: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const reduceMotion = await Promise.resolve(
        AccessibilityInfo.isReduceMotionEnabled(),
      ).catch(() => false);

      if (!mounted) return;

      if (reduceMotion) {
        progress.setValue(1);
        return;
      }

      Animated.timing(progress, {
        toValue: 1,
        delay,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    run();

    return () => {
      mounted = false;
      progress.stopAnimation();
    };
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
