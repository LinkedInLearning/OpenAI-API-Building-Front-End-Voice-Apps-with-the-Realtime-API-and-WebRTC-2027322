/**
 * Function calls
 * 
 * @link https://platform.openai.com/docs/guides/function-calling
 */

// Export tools object
export const tools = [
  {
    type: 'function',
    name: 'getWeatherData',
    description: 'Requests weather data from the Open Meteo API based on either the browser geolocation or a specified location name provided by the user.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'The latitude of the location' },
        lon: { type: 'number', description: 'The longitude of the location' },
        locationName: { type: 'string', description: 'The name of the location to search for' },
      },
    },
  },
  {
    type: 'function',
    name: 'getBrowserLocationWeatherData',
    description: 'Requests the browser geolocation and uses it to obtain local weather data.',
  }
]