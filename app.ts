import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(express.json());

// Initialize Gemini SDK with telemetry header as per guidelines
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is missing.");
}

// Helper to check Gemini client
function getAi(): GoogleGenAI {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel.");
  }
  return ai;
}

// 1. API: Weather Commentary & Recommendations
app.post("/api/weather/commentary", async (req, res) => {
  try {
    const { region, temp, humidity, wind, condition, rain } = req.body;
    const client = getAi();

    const systemInstruction = `
You are a witty, friendly, and highly professional Korean weather analyst and lifestyle stylist.
Your job is to analyze the given weather parameters and generate a personalized, creative lifestyle and fashion briefing in Korean.

Parameters provided:
- Region (지역): ${region}
- Temperature (기온): ${temp}°C
- Humidity (습도): ${humidity}%
- Wind Speed (풍속): ${wind} m/s
- Rain/Precipitation (강수량): ${rain} mm/h
- Overall Condition (날씨 상태): ${condition}

Please compute or discuss:
1. Discomfort Index (불쾌지수) - Explain how it feels in a fun and relatable way.
2. Wind Chill or Cooling (체감 온도 및 바람의 영향).
3. Recommendation for outfits (e.g. "장화(Rainboots) 추천", "반팔과 선글라스", "가벼운 겉옷/바람막이" etc. based on rain and wind).
4. A useful daily climate tip (laundry, car wash, ventilation, outdoor activities).

You must respond STRICTLY with a valid JSON object matching this structure:
{
  "commentary": "A friendly, cohesive, and witty commentary (2-3 sentences) in Korean analyzing how this weather feels physically.",
  "clothingRecommendation": "Specific fashion advice (1-2 sentences) in Korean (e.g. recommending rainboots, linen shirts, or thin layers).",
  "lifestyleTip": "A practical daily tip in Korean regarding laundry, ventilation, outdoor sports, or health.",
  "sensoryFeel": "A very short catchphrase describing the weather feeling (e.g. '습하고 끈적여요', '선선하고 상쾌해요', '살이 타는 듯한 더위', '장마비 철벽 방어 필요!')"
}
Do not include any markdown backticks (\`\`\`json) in your response. Just return the raw JSON string.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate the weather briefing JSON.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error in weather commentary API:", error);
    res.status(500).json({
      error: error.message || "Failed to generate commentary",
      commentary: "날씨 정보를 분석하는 도중 오류가 발생했습니다. 하지만 상쾌한 하루를 보내시길 바랍니다!",
      clothingRecommendation: "날씨에 맞는 편안한 옷차림을 권장합니다.",
      lifestyleTip: "급격한 기후 변화에 대비해 건강 관리에 유의하세요.",
      sensoryFeel: "정보 준비 중"
    });
  }
});

// 2. API: Weather & Climate AI Chatbot
app.post("/api/weather/chat", async (req, res) => {
  try {
    const { messages, currentWeather } = req.body;
    const client = getAi();

    // Format weather info for context
    const weatherContext = currentWeather
      ? `현재 선택된 지역: ${currentWeather.region}
- 기온: ${currentWeather.temp}°C
- 습도: ${currentWeather.humidity}%
- 풍속: ${currentWeather.wind}m/s
- 강수량: ${currentWeather.rain}mm/h
- 날씨: ${currentWeather.condition}`
      : "현재 전국적으로 다양한 기후 분포를 보이고 있습니다.";

    const systemInstruction = `
당신은 기후 및 날씨 전문 AI 비서 '클라이밋 버디(Climate Buddy)'입니다.
친절하고 재치 있으며, 전문적인 지식을 기반으로 사용자의 질문에 답해줍니다.

[현재 사용자가 보고 있는 날씨 정보]
${weatherContext}

[답변 원칙]
1. 사용자가 현재 날씨와 관련된 질문(예: "장화 신어야 해?", "오늘 빨래 해도 돼?", "오늘 너무 덥다")을 하면 위의 날씨 정보 컨텍스트를 적극 반영하여 구체적이고 위트 있게 답변하세요.
2. 기후 변화나 기상 현상에 대한 전문적인 질문(예: "엘니뇨가 뭐야?", "이 비는 기후변화 때문인가요?")에는 신뢰할 수 있는 과학적 사실을 알기 쉽게 비유를 들어 답변하세요.
3. 한국어 반말이나 존댓말 모두 친근하게 대응하되, 기본적으로 다정하고 편안한 대화체(해요체)를 사용해 주세요.
4. 너무 긴 서론은 생략하고 핵심과 재치를 담아 2~3문단 내외로 간결하고 가독성 좋게(줄바꿈 활용) 답변하세요.
`;

    // Map conversation messages to Gemini contents structure
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in AI weather chat API:", error);
    res.status(500).json({
      error: error.message || "Failed to generate chat response",
      text: "죄송해요, 대화 분석 중 일시적인 번개가 쳤나 봐요! 잠시 후 다시 질문해 주시겠어요?"
    });
  }
});

// 3. API: Weather & Address Search Geocoding
app.post("/api/weather/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required" });
    }
    const client = getAi();

    const systemInstruction = `
You are a highly professional Korean geographical search and meteorological simulation engine.
The user is searching for a location in South Korea (e.g., "역삼동", "제주 서귀포", "강릉시", "부산 영도구").

Your tasks:
1. Parse the search query and find the real-world official address (도로명 주소 or 지번 주소) of this location.
2. Estimate its coordinate coordinates (x, y) relative to our South Korea SVG map boundary (viewBox="0 0 100 110"):
   Here is the geographic reference for coordinates:
   - Seoul/Incheon/Gyeonggi (Northwest): x is 25 to 45, y is 15 to 30. Example: Seoul is (35, 22), Incheon is (26, 22), Gyeonggi is (42, 25).
   - Gangwon (Northeast/East): x is 50 to 75, y is 12 to 32. Example: Gangwon center is (58, 18).
   - Chungcheong/Daejeon/Sejong (Center/West-Center): x is 30 to 50, y is 35 to 48. Example: Daejeon is (40, 44), Sejong is (37, 39).
   - Jeolla/Gwangju (Southwest): x is 20 to 35, y is 50 to 80. Example: Jeonnam is (26, 72), Gwangju is (28, 67).
   - Gyeongsang/Daegu/Busan/Ulsan (Southeast): x is 50 to 75, y is 40 to 75. Example: Busan is (64, 68), Daegu is (58, 53), Gyeongbuk is (64, 44).
   - Jeju (South Island): x is 20 to 30, y is 90 to 100. Example: Jeju is (25, 93).
   Please map the query's real location to a highly accurate (x, y) coordinate inside these ranges. For example, if they search "역삼동", it's in Seoul, so it should be near x: 35, y: 22. If they search "해운대", it's in Busan, so it should be near x: 64, y: 68.
3. Generate realistic, localized, and logically consistent weather parameters for this specific location.
   If the region matches a general area of South Korea, align its weather with that area's weather parameters, but add slight variations:
   - Temperature (temp): between 20.0 and 34.0°C.
   - Humidity (humidity): between 50 and 95%.
   - Wind Speed (wind): between 0.5 and 10.0 m/s.
   - Rain/Precipitation rate (rain): between 0.0 and 30.0 mm/h.
   - Condition: Must be one of "sunny" | "cloudy" | "rainy" | "windy" | "thunderstorm". Make sure it is consistent with the rain value (e.g. if rain > 10, use "rainy" or "thunderstorm"; if rain == 0, use "sunny", "cloudy" or "windy").
   - radarForecast: Must be an array of exactly 6 numbers representing simulated radar forecasting for [current, +1h, +2h, +3h, +4h, +6h] starting with the current 'rain' value as the first element, and simulated progression for the next hours.

You must respond STRICTLY with a valid JSON object matching this structure:
{
  "id": "A unique lowercase string id (e.g., 'seoul-yeoksam')",
  "name": "Short Korean name of the searched location (e.g., '역삼동')",
  "englishName": "English translation (e.g., 'Yeoksam-dong')",
  "fullAddress": "The official full address of this location in South Korea (e.g., '서울특별시 강남구 역삼동')",
  "x": 35.2,
  "y": 22.4,
  "temp": 28.3,
  "humidity": 81,
  "wind": 2.3,
  "rain": 4.5,
  "condition": "rainy",
  "radarForecast": [4.5, 6.0, 8.5, 3.2, 1.0, 0.0]
}
Do not include any markdown backticks (\`\`\`json) in your response. Just return the raw JSON string.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Search and generate weather for query: "${query}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error in weather search API:", error);
    res.status(500).json({ error: error.message || "Failed to search location" });
  }
});

export default app;
