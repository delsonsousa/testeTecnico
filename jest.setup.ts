import { Animated } from 'react-native';

const instantAnimation: ReturnType<typeof Animated.timing> = {
  start: (callback?: Animated.EndCallback) => {
    callback?.({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
};

jest.spyOn(Animated, 'timing').mockReturnValue(instantAnimation);
jest.spyOn(Animated, 'spring').mockReturnValue(instantAnimation);
