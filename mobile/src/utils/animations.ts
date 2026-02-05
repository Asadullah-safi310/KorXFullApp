import { 
  withSpring, 
  withTiming, 
  useAnimatedStyle, 
  useSharedValue, 
  interpolate,
  Extrapolate,
  Layout,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight
} from 'react-native-reanimated';

export const springConfig = {
  damping: 15,
  stiffness: 120,
  mass: 1,
};

export const timingConfig = {
  duration: 300,
};

// Wizard Transitions
export const wizardNextIn = SlideInRight.duration(300);
export const wizardNextOut = SlideOutLeft.duration(300);
export const wizardBackIn = SlideInLeft.duration(300);
export const wizardBackOut = SlideOutRight.duration(300);

// Entrance Animations
export const listItemEntrance = (index: number) => {
  return FadeIn.delay(Math.min(index * 50, 400)).duration(400);
};

// Shared Layout Transitions
export const smoothLayout = Layout.springify().damping(15).stiffness(120);

// Interaction Helpers
export const usePressAnimation = () => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  const onPressIn = () => {
    scale.value = withSpring(0.96, springConfig);
  };
  
  const onPressOut = () => {
    scale.value = withSpring(1, springConfig);
  };
  
  return { animatedStyle, onPressIn, onPressOut };
};

export const useFavoriteAnimation = (isActive: boolean) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  // Trigger animation when status changes
  const animate = () => {
    scale.value = withSpring(1.3, springConfig, () => {
      scale.value = withSpring(1, springConfig);
    });
  };
  
  return { animatedStyle, animate };
};
