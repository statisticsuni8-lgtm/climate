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

// Robust local geocoding & weather simulator fallback
function getFallbackWeatherData(query: string): any {
  const queryClean = query.trim().toLowerCase();
  
  let name = query.trim();
  let englishName = "Custom Region";
  let fullAddress = `대한민국 경기도 성남시 분당구`;
  let x = 42;
  let y = 25;
  let temp = 26.5;
  let humidity = 78;
  let wind = 1.8;
  let rain = 0.0;
  let condition: "sunny" | "cloudy" | "rainy" | "windy" | "thunderstorm" = "cloudy";
  
  if (queryClean.includes("역삼") || queryClean.includes("강남") || queryClean.includes("서초") || queryClean.includes("서울")) {
    name = queryClean.includes("역삼") ? "역삼동" : (queryClean.includes("강남") ? "강남구" : (queryClean.includes("서초") ? "서초동" : "서울"));
    englishName = queryClean.includes("역삼") ? "Yeoksam-dong" : (queryClean.includes("강남") ? "Gangnam-gu" : (queryClean.includes("서초") ? "Seocho-dong" : "Seoul"));
    fullAddress = queryClean.includes("역삼") 
      ? "서울특별시 강남구 역삼동 테헤란로 152" 
      : (queryClean.includes("강남") ? "서울특별시 강남구 학동로 426" : "서울특별시 중구 세종대로 110 (서울시청)");
    x = 35;
    y = 22;
    temp = 28.2;
    humidity = 82;
    wind = 2.0;
    rain = 4.2;
    condition = "rainy";
  } else if (queryClean.includes("해운대") || queryClean.includes("부산") || queryClean.includes("광안리")) {
    name = queryClean.includes("해운대") ? "해운대구" : "부산";
    englishName = queryClean.includes("해운대") ? "Haeundae" : "Busan";
    fullAddress = queryClean.includes("해운대") ? "부산광역시 해운대구 우동 해운대해변로 264" : "부산광역시 연제구 중앙대로 1001";
    x = 64;
    y = 68;
    temp = 25.8;
    humidity = 90;
    wind = 4.5;
    rain = 12.0;
    condition = "rainy";
  } else if (queryClean.includes("제주") || queryClean.includes("서귀포")) {
    name = queryClean.includes("서귀포") ? "서귀포시" : "제주";
    englishName = queryClean.includes("서귀포") ? "Seogwipo" : "Jeju";
    fullAddress = queryClean.includes("서귀포") ? "제주특별자치도 서귀포시 서귀동 12" : "제주특별자치도 제주시 신대로 64";
    x = 25;
    y = 93;
    temp = 29.0;
    humidity = 85;
    wind = 5.2;
    rain = 1.2;
    condition = "windy";
  } else if (queryClean.includes("인천") || queryClean.includes("송도")) {
    name = queryClean.includes("송도") ? "송도동" : "인천";
    englishName = queryClean.includes("송도") ? "Songdo-dong" : "Incheon";
    fullAddress = "인천광역시 연수구 송도동 23-4";
    x = 26;
    y = 22;
    temp = 24.5;
    humidity = 72;
    wind = 3.8;
    rain = 0.0;
    condition = "cloudy";
  } else if (queryClean.includes("강릉") || queryClean.includes("속초") || queryClean.includes("강원")) {
    name = queryClean.includes("속초") ? "속초시" : "강릉";
    englishName = queryClean.includes("속초") ? "Sokcho" : "Gangneung";
    fullAddress = "강원특별자치도 강릉시 강릉대로 33";
    x = 65;
    y = 18;
    temp = 23.0;
    humidity = 65;
    wind = 3.0;
    rain = 0.0;
    condition = "sunny";
  } else if (queryClean.includes("광주")) {
    name = "광주";
    englishName = "Gwangju";
    fullAddress = "광주광역시 서구 내방로 111";
    x = 28;
    y = 67;
    temp = 27.0;
    humidity = 79;
    wind = 1.5;
    rain = 0.0;
    condition = "cloudy";
  } else if (queryClean.includes("대구")) {
    name = "대구";
    englishName = "Daegu";
    fullAddress = "대구광역시 중구 공평로 88";
    x = 58;
    y = 53;
    temp = 32.5;
    humidity = 55;
    wind = 1.2;
    rain = 0.0;
    condition = "sunny";
  } else if (queryClean.includes("대전")) {
    name = "대전";
    englishName = "Daejeon";
    fullAddress = "대전광역시 서구 둔산로 100";
    x = 40;
    y = 44;
    temp = 28.0;
    humidity = 68;
    wind = 1.7;
    rain = 0.0;
    condition = "sunny";
  } else if (queryClean.includes("세종")) {
    name = "세종";
    englishName = "Sejong";
    fullAddress = "세종특별자치시 한누리대로 2130";
    x = 37;
    y = 39;
    temp = 27.8;
    humidity = 70;
    wind = 1.6;
    rain = 0.0;
    condition = "sunny";
  } else if (queryClean.includes("울산")) {
    name = "울산";
    englishName = "Ulsan";
    fullAddress = "울산광역시 남구 중앙로 201";
    x = 69;
    y = 58;
    temp = 26.0;
    humidity = 82;
    wind = 4.2;
    rain = 2.5;
    condition = "rainy";
  } else {
    const charCodeSum = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    x = 25 + (charCodeSum % 40);
    y = 15 + ((charCodeSum >> 2) % 65);
    temp = 22.0 + parseFloat(((charCodeSum % 110) / 10).toFixed(1));
    humidity = 50 + (charCodeSum % 46);
    wind = parseFloat((0.5 + (charCodeSum % 8) / 1.5).toFixed(1));
    rain = (charCodeSum % 5 === 0) ? parseFloat(((charCodeSum % 15) + 0.5).toFixed(1)) : 0.0;
    condition = rain > 10.0 ? "thunderstorm" : (rain > 0 ? "rainy" : (humidity > 80 ? "cloudy" : "sunny"));
    
    let province = "경기도";
    if (x > 50 && y < 35) province = "강원특별자치도";
    else if (x > 50 && y >= 35 && y < 60) province = "경상북도";
    else if (x > 50 && y >= 60) province = "경상남도";
    else if (x <= 50 && y >= 35 && y < 50) province = "충청남도";
    else if (x <= 50 && y >= 50 && y < 70) province = "전라북도";
    else if (x <= 50 && y >= 70) province = "전라남도";
    
    fullAddress = `대한민국 ${province} ${name}`;
    englishName = name.replace(/[^a-zA-Z]/g, "") || "Localized Area";
    if (!englishName) {
      englishName = `Region-${charCodeSum % 1000}`;
    }
  }

  const radarForecast = [
    rain,
    Math.max(0, parseFloat((rain * 1.2 + (rain === 0 ? 0 : 0.5)).toFixed(1))),
    Math.max(0, parseFloat((rain * 1.5 + (rain === 0 ? 0 : 1.0)).toFixed(1))),
    Math.max(0, parseFloat((rain * 0.8).toFixed(1))),
    Math.max(0, parseFloat((rain * 0.3).toFixed(1))),
    Math.max(0, parseFloat((rain * 0.05).toFixed(1))),
  ];

  return {
    id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    englishName,
    fullAddress,
    x,
    y,
    temp,
    humidity,
    wind,
    rain,
    condition,
    radarForecast
  };
}

// 1. API: Weather Commentary & Recommendations
app.post("/api/weather/commentary", async (req, res) => {
  const { region, temp, humidity, wind, condition, rain } = req.body;

  const getFallbackCommentary = () => {
    const isRainy = rain > 0;
    const di = Math.round(1.8 * temp - 0.55 * (1 - humidity / 100) * (1.8 * temp - 26) + 32);
    let feel = "쾌적해요";
    if (di >= 80) feel = "매우 후텁지근해요";
    else if (di >= 75) feel = "조금 끈적여요";
    else if (temp < 15) feel = "쌀쌀하고 선선해요";
    
    return {
      commentary: `${region} 지역은 현재 기온 ${temp}°C, 습도 ${humidity}%로 공기의 흐름이 조화를 이루고 있습니다. ${isRainy ? "내리는 빗방울과 함께 시원한 바람이 체감 온도를 조절해 주네요." : "화창하고 선선한 기상 상태를 만끽해 보세요."}`,
      clothingRecommendation: isRainy ? "비가 내려 지면이 젖었으니 튼튼한 장화(Rainboots)나 미끄럼 방지 슈즈를 추천드려요." : "쾌적하고 얇은 자켓이나 가디건을 매치해 체온을 일정하게 유지해보세요.",
      lifestyleTip: isRainy ? "실내 환기는 잠시 미루고 제습기나 에어컨 제습 모드를 가동하는 것이 집안을 보송하게 유지하는 꿀팁입니다." : "실외 환기를 하기 딱 좋은 타이밍입니다! 30분간 환기를 시켜 실내 공기를 정화해 보세요.",
      sensoryFeel: feel
    };
  };

  try {
    if (!apiKey) {
      return res.json(getFallbackCommentary());
    }

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
  const { messages, currentWeather } = req.body;

  const getFallbackChatReply = () => {
    const userMsg = messages[messages.length - 1]?.content || "";
    let reply = "안녕하세요! 날씨와 기후 전문 비서 '클라이밋 버디'입니다. 현재 인공지능 실시간 통신 모드가 시뮬레이션 상태로 원활히 연결되어 작동 중입니다. 궁금한 점이 있으시다면 언제든지 물어보세요!";
    if (userMsg.includes("비") || userMsg.includes("우산") || userMsg.includes("장화") || userMsg.includes("비오") || userMsg.includes("강수")) {
      reply = `현재 선택된 ${currentWeather?.name || "지역"}의 실시간 강수량은 ${currentWeather?.rain || 0}mm/h입니다. 비가 오거나 강수가 예측되는 상황에서는 외출 시 발목까지 감싸주는 튼튼한 장화(Rainboots)나 미끄럼 방지 슈즈를 챙기시고, 가벼운 휴대용 우산을 휴대하는 것을 추천해 드려요!`;
    } else if (userMsg.includes("더워") || userMsg.includes("더위") || userMsg.includes("여름") || userMsg.includes("온도") || userMsg.includes("기온")) {
      reply = `최근 기후 변화의 영향으로 우리나라의 평균 여름 기온이 상승하고 있습니다. 오늘 ${currentWeather?.name || "선택된 지역"}의 현재 기온은 ${currentWeather?.temp || 27}°C인데요, 불쾌지수 역시 높아질 수 있으므로 충분히 수분을 섭취해 주시고 통풍이 잘 되는 린넨이나 기능성 의류를 착용하시는 걸 강추합니다!`;
    } else if (userMsg.includes("안녕") || userMsg.includes("하이") || userMsg.includes("반갑")) {
      reply = `반가워요! 저는 기후 및 날씨 코디를 제안하는 똑똑한 비서 '클라이밋 버디'입니다. ☀️ 현재 선택되어 있는 ${currentWeather?.name || "서울"} 지역의 실시간 기상 상태와 초단기 강수예측 수치를 기반으로 맞춤 코디 및 실생활 팁을 친절하게 전해드리고 있으니 언제든 편하게 물어보세요!`;
    } else if (userMsg.includes("검색") || userMsg.includes("지역") || userMsg.includes("찾아")) {
      reply = "왼쪽의 돋보기 아이콘이 그려진 검색바에 원하시는 지명(예: 역삼동, 제주, 해운대 등)을 입력하시면, 즉시 그 지역의 정밀한 좌표와 함께 초단기 강수 시뮬레이션 및 맞춤형 라이프스타일 팁이 새롭게 계산됩니다. 직접 한 번 검색해 보세요!";
    }
    return { text: reply };
  };

  try {
    if (!apiKey) {
      return res.json(getFallbackChatReply());
    }

    const client = getAi();

    // Format weather info for context
    const weatherContext = currentWeather
      ? `현재 선택된 지역: ${currentWeather.name}
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

    // Filter messages to ensure the first message is from 'user'
    let filteredMessages = messages;
    const firstUserIndex = messages.findIndex((m: any) => m.role === "user");
    if (firstUserIndex !== -1) {
      filteredMessages = messages.slice(firstUserIndex);
    }

    // Map conversation messages to Gemini contents structure
    const contents = filteredMessages.map((m: any) => ({
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
    res.json(getFallbackChatReply());
  }
});

// 3. API: Weather & Address Search Geocoding
app.post("/api/weather/search", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    if (!apiKey) {
      return res.json(getFallbackWeatherData(query));
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
    res.json(getFallbackWeatherData(query));
  }
});

export default app;
