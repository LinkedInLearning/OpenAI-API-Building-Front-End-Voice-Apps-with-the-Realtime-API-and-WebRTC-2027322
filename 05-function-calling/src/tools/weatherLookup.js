/**
 * Functions to help get weather information from the Open Meteo API
 * 
 * setDataChannel(channel) - Set the data channel to send messages to the API
 * getWeatherData(lat, lon, locationName) - Get weather data from the Open Meteo API
 * getBrowserLocationWeatherData() - Get weather data from the browser's geolocation
 * 
 * @link https://open-meteo.com/
 * @link https://open-meteo.com/en/docs/geocoding-api
 */
import { CONFIG } from '../config.js';
// Store the data channel reference
let dataChannel = null;

// Function to set the data channel
export function setDataChannel(channel) {
  dataChannel = channel;
}

/**
 * Send weather data to the API as a voice request
 * 
 * @param {string} type - The type of data to send
 * @param {Object} data - The data to send
 */
function sendDataToAPI(type, data) {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    console.error('Data channel not ready');
    return;
  }

  let instructions = CONFIG.DEFAULTS.DEFAULT_INSTRUCTIONS;
  if (type === 'weather') {
    instructions = CONFIG.DEFAULTS.WEATHER_INSTRUCTIONS;
  }

  // Create a user message with the weather data
  const messageEvent = {
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [
        {
          type: "input_text",
          text: `Here is the ${type} data: ${data}`,
        },
      ],
    },
  };
  dataChannel.send(JSON.stringify(messageEvent));

  // Request a voice and text response describing the weather
  const responseEvent = {
    type: 'response.create',
    response: {
      modalities: ['audio', 'text'],
      instructions: instructions
    },

  };
  dataChannel.send(JSON.stringify(responseEvent));
}

/**
 * Get weather information from the Open Meteo API
 * 
 * @param {number} lat - The latitude of the location
 * @param {number} lon - The longitude of the location
 * @param {string} [locationName] - Optional location name to search for instead of coordinates
 * @returns {Promise<Object>} The weather data
 */
export async function getWeatherData(lat = null, lon = null, locationName = null) {
  console.log(`Function called: getWeatherData lat: ${lat}, lon: ${lon}, locationName: ${locationName}`);
  try {
    // If locationName is provided, use geocoding API to get coordinates
    if (locationName) {
      const geocodingResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1`);
      const geocodingData = await geocodingResponse.json();

      if (!geocodingData.results || geocodingData.results.length === 0) {
        throw new Error('Location not found');
      }

      // Override lat and lon even if they are provided
      const location = geocodingData.results[0];
      lat = location.latitude;
      lon = location.longitude;
    }

    // Get weather data using the coordinates
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const weatherData = await weatherResponse.json();

    // Send the weather data to the API for voice response
    sendDataToAPI('weather',JSON.stringify(weatherData, null, 2));

    return;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

/**
 * Get the browser's geolocation
 * 
 * @returns {Promise<Object>} The geolocation data
 */
export async function getBrowserLocationWeatherData() {
  console.log(`Function called: getBrowserLocationWeatherData()`);
  // If the user enables location sharing, fire getWeatherData(lat, lon, null)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => getWeatherData(position.coords.latitude, position.coords.longitude, null),
    );
  } else {
    const errorMessage = "Could not access browser location. Please enable location sharing in your browser settings or provide a location name.";
    sendWeatherDataToAPI(errorMessage);
    return errorMessage;
  }
}