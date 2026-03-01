/**
 * Gemini API Service - Handles image analysis using Google Gemini API.
 * Requires EXPO_PUBLIC_GEMINI_API_KEY in .env (get key from Google AI Studio).
 */

import * as FileSystem from 'expo-file-system/legacy';

const GEMINI_MODEL = 'gemini-3-flash-preview';

function getGeminiApiUrl() {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key || String(key).trim() === '') {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        'Missing EXPO_PUBLIC_GEMINI_API_KEY in .env. Gemini API calls will fail. Get key from Google AI Studio.'
      );
    } else {
      throw new Error(
        'Missing EXPO_PUBLIC_GEMINI_API_KEY. Set it in .env (get key from Google AI Studio).'
      );
    }
    return null;
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
}

const convertImageToBase64 = async (imageUri) => {
  try {
    const base64String = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    return base64String;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

export const analyzeImageWithGemini = async (imageUri, habitTitle = '') => {
  try {
    const apiUrl = getGeminiApiUrl();
    if (!apiUrl) throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set in .env.');
    const base64Image = await convertImageToBase64(imageUri);

    const promptText = `Analyze this image and determine if it shows progress related to the habit: "${habitTitle}". 
Look for specific indicators like:
- For exercise habits: running shoes, workout clothes, exercise poses, fitness trackers, gym equipment, track logs, running poses
- For water/drink habits: water bottles, glasses of water, hydration tracking
- For reading habits: books, reading materials, reading environment
- For meditation/yoga habits: yoga mats, meditation poses, peaceful settings
- For sleep habits: beds, sleep tracking devices, bedtime routines
- For eating habits: healthy food, fruits, vegetables, meal preparation

Return ONLY a valid JSON object in this exact format:
{
  "correct": true or false,
  "message": "A friendly, encouraging message if correct, or helpful guidance if incorrect"
}

If the image shows relevant progress related to the habit, set correct to true. Otherwise, set it to false.
The message should be conversational and encouraging, like an AI buddy talking to the user.`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
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

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      const errorCode = errorData.error?.code;
      console.log('Gemini API Error:', { status: response.status, error: errorData.error, fullError: errorData });
      if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('billing') || errorMessage.toLowerCase().includes('resource exhausted') || response.status === 429 || errorCode === 429) {
        throw new Error('API quota exceeded. Please check your Google Cloud billing and quota limits.');
      }
      if (response.status === 401 || errorCode === 401) {
        throw new Error('Invalid API key. Please check your Gemini API key.');
      }
      if (errorMessage.toLowerCase().includes('model') && errorMessage.toLowerCase().includes('not found')) {
        throw new Error(`Model not found: ${GEMINI_MODEL}. Please check the model name.`);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsedResult = null;
    try {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : textResponse;
      parsedResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn('Failed to parse JSON response, attempting fallback parsing:', parseError);
      const correctMatch = textResponse.match(/correct["\s:]*([tf]rue|[tf]alse)/i);
      const messageMatch = textResponse.match(/message["\s:]*["']([^"']+)["']/i);
      parsedResult = {
        correct: correctMatch ? correctMatch[1].toLowerCase().includes('true') : false,
        message: messageMatch ? messageMatch[1] : textResponse || 'Unable to analyze image properly.'
      };
    }

    if (!parsedResult || typeof parsedResult.correct !== 'boolean') {
      console.warn('Invalid JSON structure, using fallback');
      parsedResult = {
        correct: false,
        message: textResponse || 'Unable to verify if this image shows progress for your habit.'
      };
    }

    return {
      success: true,
      data: {
        correct: parsedResult.correct,
        message: parsedResult.message || 'Analysis complete.',
        rawResponse: textResponse,
        fullResponse: data
      }
    };
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    return { success: false, error: error.message || 'Failed to analyze image' };
  }
};

export const generateHabitCompliment = async (habitData) => {
  try {
    const { habitName, frequency, environment, reminderTime } = habitData;
    const formatTime = (date) => {
      if (!date) return '8:30 pm';
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${period}`;
    };
    const timeString = formatTime(reminderTime);
    const scheduleText = frequency === 'daily' ? `daily at ${timeString}` : `weekly at ${timeString}`;

    const promptText = `Generate a short, warm, and encouraging compliment message for someone who just created a new habit. 

Habit details:
- Habit: "${habitName}"
- Schedule: ${scheduleText}
- Location: ${environment}

Requirements:
- Keep it under 2 sentences
- Be warm, encouraging, and personal
- Mention the habit name naturally
- Be motivational but not overly enthusiastic
- Use a friendly, supportive tone like a caring friend
- Don't use emojis or special characters
- Focus on celebrating this first step

Example style: "Starting your journey with [habit] is a beautiful commitment to yourself. Every small step counts, and you're already on your way!"

Generate ONLY the compliment message text, nothing else.`;

    const apiUrl = getGeminiApiUrl();
    if (!apiUrl) throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set in .env.');
    const payload = {
      contents: [{ parts: [{ text: promptText }] }]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    let cleanedResponse = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    cleanedResponse = cleanedResponse.replace(/```[\s\S]*?```/g, '');
    cleanedResponse = cleanedResponse.replace(/^["']|["']$/g, '');
    cleanedResponse = cleanedResponse.trim();

    if (!cleanedResponse) throw new Error('Empty response from API');

    return { success: true, data: cleanedResponse };
  } catch (error) {
    console.error('Error generating habit compliment:', error);
    return { success: false, error: error.message || 'Failed to generate compliment' };
  }
};
