exports.getWeather = async (location) => {
    if (!process.env.WEATHER_API_KEY || process.env.WEATHER_API_KEY === 'YOUR_WEATHER_API_KEY_HERE') {
        return { success: false, error: "Weather provider not configured." };
    }
    // Implement fetch to weather API securely here
    return { success: true, temperature: "24°C", condition: "Clear", location };
};