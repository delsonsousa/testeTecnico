import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ScalePressableProps = PressableProps & {
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
};

export const ScalePressable = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ScalePressableProps
>(
  (
    {
      children,
      disabled,
      onPressIn,
      onPressOut,
      pressedScale = 0.97,
      style,
      ...props
    },
    ref,
  ) => {
    const scale = useRef(new Animated.Value(1)).current;

    const pressTo = (toValue: number) => {
      Animated.spring(scale, {
        toValue,
        speed: 28,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    };

    return (
      <AnimatedPressable
        {...props}
        ref={ref}
        disabled={disabled}
        onPressIn={(event) => {
          if (!disabled) pressTo(pressedScale);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          if (!disabled) pressTo(1);
          onPressOut?.(event);
        }}
        style={[style, { transform: [{ scale }] }]}
      >
        {children}
      </AnimatedPressable>
    );
  },
);

ScalePressable.displayName = 'ScalePressable';
