import { useState, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * Reusable hook for managing step animations with entry and exit transitions
 * 
 * @param {number} currentStep - The current step number
 * @param {number} targetStep - The step number this hook is managing animations for
 * @param {Object} config - Configuration object
 * @param {Array<Object>} config.elements - Array of element configurations
 * @param {string} config.elements[].name - Unique name for the element
 * @param {Object} config.elements[].entry - Entry animation config
 * @param {number} config.elements[].entry.delay - Delay before animation starts (ms)
 * @param {number} config.elements[].entry.duration - Animation duration (ms)
 * @param {boolean} config.elements[].entry.parallel - Whether to animate in parallel with previous elements
 * @param {Object} config.exit - Exit animation config
 * @param {number} config.exit.duration - Exit animation duration (ms)
 * @param {boolean} config.exit.parallel - Whether to animate all elements out in parallel
 * @param {number} config.slideInDistance - Distance to slide in from right (default: 300)
 * @param {number} config.slideOutDistance - Distance to slide out to left (default: 400)
 * 
 * @returns {Object} Animation values and handlers
 * @returns {Object} return.animations - Object with animation values keyed by element name
 * @returns {Function} return.triggerExit - Function to trigger exit animations
 * @returns {Function} return.resetAnimations - Function to reset all animations
 */
export function useStepAnimation(currentStep, targetStep, config = {}) {
  const {
    elements = [],
    exit = { duration: 400, parallel: true },
    slideInDistance = 300,
    slideOutDistance = 400,
  } = config;

  // Create entry animation values
  const entryAnimations = useState(() => {
    const anims = {};
    elements.forEach(({ name }) => {
      anims[name] = new Animated.Value(0);
    });
    return anims;
  })[0];

  // Create exit animation values
  const exitAnimations = useState(() => {
    const anims = {};
    elements.forEach(({ name }) => {
      anims[name] = new Animated.Value(0);
    });
    return anims;
  })[0];

  // Reset all animations
  const resetAnimations = () => {
    elements.forEach(({ name }) => {
      entryAnimations[name].setValue(0);
      exitAnimations[name].setValue(0);
    });
  };

  // Trigger entry animations when step becomes active
  useEffect(() => {
    if (currentStep === targetStep) {
      resetAnimations();

      // Build sequential animations (each waits for previous to complete)
      let cumulativeDelay = 0;
      const animationSequence = [];

      elements.forEach(({ name, entry = {} }) => {
        const {
          delay = 0,
          duration = 400,
        } = entry;

        // Add delay from previous animations + current delay
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

        // Update cumulative delay for next animation
        cumulativeDelay = totalDelay + duration;
      });

      if (animationSequence.length > 0) {
        // Run all animations in parallel (they have their own delays)
        Animated.parallel(animationSequence).start();
      }
    } else {
      // Reset when leaving the step
      resetAnimations();
    }
  }, [currentStep, targetStep]);

  // Trigger exit animations
  const triggerExit = (onComplete) => {
    // Reset exit animations
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

  // Get animation style for an element
  const getAnimationStyle = (elementName) => {
    const entryAnim = entryAnimations[elementName];
    const exitAnim = exitAnimations[elementName];

    if (!entryAnim || !exitAnim) {
      return {};
    }

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
