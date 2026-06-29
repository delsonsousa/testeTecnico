import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import styled from 'styled-components/native';

const Track = styled.View<{ height: number }>`
  height: ${({ height }) => height}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radius.pill}px;
  overflow: hidden;
`;

const Fill = styled(Animated.View)<{ color: string }>`
  height: 100%;
  background-color: ${({ color }) => color};
  border-radius: ${({ theme }) => theme.radius.pill}px;
`;

export function AnimatedMeter({
  value,
  color,
  height = 7,
}: {
  value: number;
  color: string;
  height?: number;
}) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clampedValue,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clampedValue, progress]);

  return (
    <Track height={height}>
      <Fill
        color={color}
        style={{
          width: progress.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </Track>
  );
}
