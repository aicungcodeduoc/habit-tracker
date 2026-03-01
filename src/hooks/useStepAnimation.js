import { useState, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * Reusable hook for managing step animations with entry and exit transitions
 */
export function useStepAnimation(currentStep, targetStep, config = {}) {
  const {
    elements = [],
    exit = { duration: 400, parallel: true },
    slideInDistance = 300,
    slideOutDistance = 400,
  } = config;

  const entryAnimations = useState(() => {
    const anims = {};
    elements.forEach(({ name }) => {
      anims[name] = new Animated.Value(0);
    });
    return anims;
  })[0];

  const exitAnimations = useState(() => {
    const anims = {};
    elements.forEach(({ name }) => {
      anims[name] = new Animated.Value(0);
    });
    return anims;
  })[0];

  const resetAnimations = () => {
    elements.forEach(({ name }) => {
      entryAnimations[name].setValue(0);
      exitAnimations[name].setValue(0);
    });
  };

  useEffect(() => {
    if (currentStep === targetStep) {
      resetAnimations();
      let cumulativeDelay = 0;
      const animationSequence = [];
      elements.forEach(({ name, entry = {} }) => {
        const { delay = 0, duration = 400 } = entry;
        const totalDelay = cumulativeDelay + delay;
        animationSequence.push(
          Animated.sequence([
            Animated.delay(totalDelay),
            Animated.timing(entryAnimations[name], {
              toValue: 1,
              duration,
              useNativeDriver: true,
            }),
          ])
        );
        cumulativeDelay = totalDelay + duration;
      });
      if (animationSequence.length > 0) {
        Animated.parallel(animationSequence).start();
      }
    } else {
      resetAnimations();
    }
  }, [currentStep, targetStep]);

  const triggerExit = (onComplete) => {
    elements.forEach(({ name }) => {
      exitAnimations[name].setValue(0);
    });
    const exitAnims = elements.map(({ name }) =>
      Animated.timing(exitAnimations[name], {
        toValue: 1,
        duration: exit.duration,
        useNativeDriver: true,
      })
    );
    if (exit.parallel) {
      Animated.parallel(exitAnims).start(onComplete);
    } else {
      Animated.sequence(exitAnims).start(onComplete);
    }
  };

  const getAnimationStyle = (elementName) => {
    const entryAnim = entryAnimations[elementName];
    const exitAnim = exitAnimations[elementName];
    if (!entryAnim || !exitAnim) return {};
    return {
      opacity: entryAnim,
      transform: [
        {
          translateX: Animated.add(
            entryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [slideInDistance, 0],
            }),
            exitAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -slideOutDistance],
            })
          ),
        },
      ],
    };
  };

  return {
    animations: entryAnimations,
    exitAnimations,
    triggerExit,
    resetAnimations,
    getAnimationStyle,
  };
}
