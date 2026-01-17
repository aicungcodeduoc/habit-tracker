/**
 * Gemini API Service - Handles image analysis using Google Gemini API
 */

import * as FileSystem from 'expo-file-system/legacy';

const GEMINI_API_KEY = 'AIzaSyCKq-O2F3Zckf7b-poc9sUpqYxap5n2ULo';
const GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Convert image URI to base64 string
 * @param {string} imageUri - Local file URI from expo-image-picker
 * @returns {Promise<string>} - Base64 encoded image string
 */
const convertImageToBase64 = async (imageUri) => {
  try {
    // Read file as base64 using expo-file-system
    // Use string 'base64' as encoding parameter
    const base64String = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    return base64String;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Analyze image using Gemini API
 * @param {string} imageUri - Local file URI from expo-image-picker
 * @param {string} habitTitle - The habit title for context
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const analyzeImageWithGemini = async (imageUri, habitTitle = '') => {
  try {
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);

    // Prepare the request payload
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this image and determine if it shows progress related to the habit: "${habitTitle}". Return a simple response indicating whether this image shows relevant progress for this habit.`
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ]
    };

    // Make API request
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      const errorCode = errorData.error?.code;
      
      // Log full error for debugging
      console.log('Gemini API Error:', {
        status: response.status,
        error: errorData.error,
        fullError: errorData
      });
      
      // Check for quota-related errors
      if (errorMessage.toLowerCase().includes('quota') || 
          errorMessage.toLowerCase().includes('billing') ||
          errorMessage.toLowerCase().includes('resource exhausted') ||
          response.status === 429 ||
          errorCode === 429) {
        throw new Error('API quota exceeded. Please check your Google Cloud billing and quota limits.');
      }
      
      // Check for invalid API key
      if (response.status === 401 || errorCode === 401) {
        throw new Error('Invalid API key. Please check your Gemini API key.');
      }
      
      // Check for model not found
      if (errorMessage.toLowerCase().includes('model') && errorMessage.toLowerCase().includes('not found')) {
        throw new Error(`Model not found: ${GEMINI_MODEL}. Please check the model name.`);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Extract the text response from Gemini
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      success: true,
      data: {
        response: textResponse,
        fullResponse: data
      }
    };
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze image'
    };
  }
};
