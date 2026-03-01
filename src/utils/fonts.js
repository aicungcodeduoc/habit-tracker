/**
 * Font configuration for the application
 * 
 * This file exports font family names that can be used throughout the app
 * to ensure consistent font usage.
 */

export const FONTS = {
  anton: 'Anton-Regular',
};

/**
 * Helper function to get font family with fallback
 * @param {string} fontName - The font name from FONTS object
 * @returns {string} Font family string with system fallback
 */
export const getFontFamily = (fontName) => {
  return fontName || 'System';
};
