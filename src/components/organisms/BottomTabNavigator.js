import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  Home, 
  Flame,
  User 
} from 'lucide-react-native';
import { AIIcon } from '../atoms';
import { 
  HomeScreen, 
  BuddyScreen, 
  StreaksScreen,
  ProfileScreen 
} from '../../screens';
import { COLORS } from '../../utils';

// Try to import liquid glass, fallback to null if not available
let LiquidGlassView = null;
let isLiquidGlassSupported = false;

try {
  const liquidGlass = require('@callstack/liquid-glass');
  LiquidGlassView = liquidGlass.LiquidGlassView;
  isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported;
} catch (_err) {
  // Liquid glass not available, will use BlurView fallback
  console.log('Liquid glass not available, using BlurView fallback');
}

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component with pill-shaped design and smooth animation
function CustomTabBar({ state, descriptors, navigation }) {
  const [translateX] = useState(() => new Animated.Value(0));
  const [backgroundWidth] = useState(() => new Animated.Value(0));
  const tabLayouts = useRef([]);
  const containerLayout = useRef(null);
  const isInitialized = useRef(false);

  const updateBackgroundPosition = (currentIndex, animated = false) => {
    if (tabLayouts.current[currentIndex] && containerLayout.current) {
      const tabLayout = tabLayouts.current[currentIndex];
        const containerPadding = 0; // padding of pillContainer
      
      // Calculate the position (x) and width for the animated background
      const targetX = tabLayout.x - containerPadding;
      const targetWidth = tabLayout.width;
      
      // Initialize on first render without animation
      if (!isInitialized.current) {
        translateX.setValue(targetX);
        backgroundWidth.setValue(targetWidth);
        isInitialized.current = true;
        return;
      }
      
      if (animated) {
        // Animate both position and width smoothly
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: targetX,
            useNativeDriver: false, // We need to use false for layout properties
            tension: 68,
            friction: 8,
          }),
          Animated.spring(backgroundWidth, {
            toValue: targetWidth,
            useNativeDriver: false,
            tension: 68,
            friction: 8,
          }),
        ]).start();
      } else {
        translateX.setValue(targetX);
        backgroundWidth.setValue(targetWidth);
      }
    }
  };

  useEffect(() => {
    const currentIndex = state.index;
    updateBackgroundPosition(currentIndex, isInitialized.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to tab index
  }, [state.index]);

  const handleTabLayout = (index, event) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };
    
    // If this is the current tab and we haven't initialized yet, update position
    if (index === state.index && containerLayout.current && !isInitialized.current) {
      // Use requestAnimationFrame to ensure layout is fully measured
      requestAnimationFrame(() => {
        updateBackgroundPosition(state.index, false);
      });
    }
  };

  const handleContainerLayout = (event) => {
    containerLayout.current = event.nativeEvent.layout;
    
    // If container layout is ready and current tab layout is ready, initialize position
    if (containerLayout.current && tabLayouts.current[state.index] && !isInitialized.current) {
      requestAnimationFrame(() => {
        updateBackgroundPosition(state.index, false);
      });
    }
  };

  const GlassComponent = LiquidGlassView && isLiquidGlassSupported ? LiquidGlassView : BlurView;
  const glassProps = LiquidGlassView && isLiquidGlassSupported 
    ? { effect: 'clear', interactive: true }
    : { intensity: 80, tint: 'light' };

  return (
    <View style={styles.tabBarContainer}>
      <GlassComponent 
        {...glassProps}
        style={[
          styles.pillContainer,
          !isLiquidGlassSupported && styles.pillContainerFallback
        ]}
        onLayout={handleContainerLayout}
      >
        {/* Animated background with liquid glass */}
        <Animated.View
          style={[
            styles.animatedBackgroundContainer,
            {
              left: translateX,
              width: backgroundWidth,
            },
          ]}
        >
          <View style={styles.animatedBackground} />
        </Animated.View>
        
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Get icon component
          let IconComponent;
          let iconSize = 20;
          
          if (route.name === 'Home') {
            IconComponent = Home;
          } else if (route.name === 'Buddy') {
            IconComponent = AIIcon;
          } else if (route.name === 'Streaks') {
            IconComponent = Flame;
          } else if (route.name === 'Profile') {
            IconComponent = User;
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              onLayout={(e) => handleTabLayout(index, e)}
              style={[
                styles.tabItem,
                index === 0 && styles.tabItemFirst,
                index === state.routes.length - 1 && styles.tabItemLast,
              ]}
            >
              <View style={styles.tabContent}>
                <IconComponent 
                  size={iconSize} 
                  color={isFocused ? COLORS.primary : '#000000'}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
                <Text style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive
                ]}>
                  {label.toLowerCase()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </GlassComponent>
    </View>
  );
}

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Streaks"
        component={StreaksScreen}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />
      <Tab.Screen
        name="Buddy"
        component={BuddyScreen}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingLeft: 6,
    paddingRight: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  pillContainerFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  animatedBackgroundContainer: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 26,
    overflow: 'hidden',
  },
  animatedBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: 'rgba(1, 196, 89, 0.15)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 26,
    zIndex: 1,
  },
  tabItemFirst: {
    marginRight: 2,
  },
  tabItemLast: {
    marginLeft: 2,
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Anton-Regular',
    marginTop: 2,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  tabLabelInactive: {
    color: '#000000',
  },
});
