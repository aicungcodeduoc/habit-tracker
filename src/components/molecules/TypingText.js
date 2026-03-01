import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

/**
 * TypingText - Component that displays text with a typing animation
 * 
 * @param {Object} props - Component props
 * @param {string} props.text - The text to display
 * @param {number} props.speed - Typing speed in milliseconds per character (default: 50)
 * @param {Object} props.style - Text style
 * @param {Function} props.onComplete - Callback when typing is complete
 * @returns {JSX.Element} TypingText component
 */
export const TypingText = ({ text, speed = 50, style, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    setDisplayedText('');
    setIsComplete(false);
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed, onComplete]);

  return (
    <Text style={style}>{displayedText}</Text>
  );
};
