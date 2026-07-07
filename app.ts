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

// Robust local geocoding & weather simulator fallback with deep "dong" level support
function getFallbackWeatherData(query: string): any {
  const queryClean = query.trim().replace(/\s+/g, " ");
  const queryLower = queryClean.toLowerCase();

  // Extract a clean short name (e.g. "서교동" from "서울 마포구 서교동")
  let name = queryClean;
  const parts = queryClean.split(" ");
  if (parts.length > 1) {
    name = parts[parts.length - 1];
  }

  // Calculate a deterministic seed based on the short name
  const charCodeSum = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  // Calculate small deterministic offsets to spread out multiple dongs in the same city
  const offsetX = (charCodeSum % 7) - 3; // -3 to +3
  const offsetY = ((charCodeSum >> 2) % 7) - 3; // -3 to +3

  // 1. Seoul / Gyeonggi-do (Northwest)
  const isSeoul = queryLower.includes("서울") || queryLower.includes("강남") || queryLower.includes("서초") || queryLower.includes("역삼") || queryLower.includes("마포") || queryLower.includes("송파") || queryLower.includes("종로") || queryLower.includes("성동") || queryLower.includes("용산") || queryLower.includes("삼성") || queryLower.includes("청담") || queryLower.includes("신사") || queryLower.includes("방배") || queryLower.includes("합정") || queryLower.includes("망원") || queryLower.includes("여의도") || queryLower.includes("홍대") || queryLower.includes("잠실") || queryLower.includes("성수") || queryLower.includes("혜화");
  
  const isIncheon = queryLower.includes("인천") || queryLower.includes("송도") || queryLower.includes("부평") || queryLower.includes("구월");
  
  const isGyeonggi = queryLower.includes("경기") || queryLower.includes("성남") || queryLower.includes("분당") || queryLower.includes("판교") || queryLower.includes("수원") || queryLower.includes("용인") || queryLower.includes("고양") || queryLower.includes("일산") || queryLower.includes("부천") || queryLower.includes("안산") || queryLower.includes("화성") || queryLower.includes("동탄") || queryLower.includes("남양주") || queryLower.includes("평택");

  // 2. Gangwon-do (Northeast)
  const isGangwon = queryLower.includes("강원") || queryLower.includes("강릉") || queryLower.includes("속초") || queryLower.includes("춘천") || queryLower.includes("원주") || queryLower.includes("양양") || queryLower.includes("동해") || queryLower.includes("삼척");

  // 3. Chungcheong-do / Daejeon / Sejong (Center)
  const isDaejeon = queryLower.includes("대전") || queryLower.includes("유성");
  const isSejong = queryLower.includes("세종");
  const isChungcheong = queryLower.includes("충청") || queryLower.includes("충북") || queryLower.includes("충남") || queryLower.includes("천안") || queryLower.includes("청주") || queryLower.includes("아산") || queryLower.includes("충주");

  // 4. Jeolla-do / Gwangju (Southwest)
  const isGwangju = queryLower.includes("광주") || queryLower.includes("서구 내방로");
  const isJeolla = queryLower.includes("전라") || queryLower.includes("전북") || queryLower.includes("전남") || queryLower.includes("전주") || queryLower.includes("익산") || queryLower.includes("군산") || queryLower.includes("여수") || queryLower.includes("순천") || queryLower.includes("목포");

  // 5. Gyeongsang-do / Busan / Daegu / Ulsan (Southeast)
  const isBusan = queryLower.includes("부산") || queryLower.includes("해운대") || queryLower.includes("광안") || queryLower.includes("수영") || queryLower.includes("영도") || queryLower.includes("동래") || queryLower.includes("남포");
  const isDaegu = queryLower.includes("대구") || queryLower.includes("수성");
  const isUlsan = queryLower.includes("울산") || queryLower.includes("남구");
  const isGyeongsang = queryLower.includes("경상") || queryLower.includes("경북") || queryLower.includes("경남") || queryLower.includes("포항") || queryLower.includes("경주") || queryLower.includes("창원") || queryLower.includes("김해") || queryLower.includes("진주") || queryLower.includes("구미") || queryLower.includes("안동");

  // 6. Jeju-do (South Island)
  const isJeju = queryLower.includes("제주") || queryLower.includes("서귀포") || queryLower.includes("노형") || queryLower.includes("연동") || queryLower.includes("애월");

  let x = 42;
  let y = 25;
  let fullAddress = "";
  let englishName = "";

  if (isSeoul) {
    x = 35 + offsetX;
    y = 22 + offsetY;
    const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "강남구" : "강남구";
    const dong = name.endsWith("동") ? name : "역삼동";
    fullAddress = `서울특별시 ${district} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, Seoul`;
  } else if (isIncheon) {
    x = 26 + offsetX;
    y = 22 + offsetY;
    const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "연수구" : "연수구";
    const dong = name.endsWith("동") ? name : "송도동";
    fullAddress = `인천광역시 ${district} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, Incheon`;
  } else if (isGyeonggi) {
    x = 38 + offsetX;
    y = 26 + offsetY;
    const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "성남시" : "성남시";
    const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "분당구" : "분당구";
    const dong = name.endsWith("동") ? name : "삼평동";
    fullAddress = `경기도 ${city} ${district} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, ${city}`;
  } else if (isBusan) {
    x = 64 + offsetX;
    y = 68 + offsetY;
    const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "해운대구" : "해운대구";
    const dong = name.endsWith("동") ? name : "우동";
    fullAddress = `부산광역시 ${district} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, Busan`;
  } else if (isDaegu) {
    x = 58 + offsetX;
    y = 53 + offsetY;
    const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "수성구" : "수성구";
    const dong = name.endsWith("동") ? name : "범어동";
    fullAddress = `대구광역시 ${district} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, Daegu`;
  } else if (isUlsan) {
    x = 69 + offsetX;
    y = 58 + offsetY;
    const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "남구" : "남구";
    const dong = name.endsWith("동") ? name : "삼산동";
    fullAddress = `울산광역시 ${district} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, Ulsan`;
  } else if (isDaejeon) {
    x = 40 + offsetX;
    y = 44 + offsetY;
    const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "유성구" : "유성구";
    const dong = name.endsWith("동") ? name : "궁동";
    fullAddress = `대전광역시 ${district} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, Daejeon`;
  } else if (isSejong) {
    x = 37 + offsetX;
    y = 39 + offsetY;
    const dong = name.endsWith("동") ? name : "보람동";
    fullAddress = `세종특별자치시 ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, Sejong`;
  } else if (isGangwon) {
    x = 60 + offsetX;
    y = 18 + offsetY;
    const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "강릉시" : "강릉시";
    const dong = name.endsWith("동") ? name : "포남동";
    fullAddress = `강원특별자치도 ${city} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, ${city}`;
  } else if (isChungcheong) {
    x = 42 + offsetX;
    y = 41 + offsetY;
    const province = queryLower.includes("충북") ? "충청북도" : "충청남도";
    const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "천안시" : "천안시";
    const dong = name.endsWith("동") ? name : "신부동";
    fullAddress = `${province} ${city} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, ${city}`;
  } else if (isGwangju) {
    x = 28 + offsetX;
    y = 67 + offsetY;
    const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "북구" : "북구";
    const dong = name.endsWith("동") ? name : "용봉동";
    fullAddress = `광주광역시 ${district} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, Gwangju`;
  } else if (isJeolla) {
    x = 26 + offsetX;
    y = 64 + offsetY;
    const province = queryLower.includes("전북") ? "전라북도" : "전라남도";
    const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "전주시" : "전주시";
    const dong = name.endsWith("동") ? name : "효자동";
    fullAddress = `${province} ${city} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, ${city}`;
  } else if (isGyeongsang) {
    x = 64 + offsetX;
    y = 52 + offsetY;
    const province = queryLower.includes("경북") ? "경상북도" : "경상남도";
    const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "포항시" : "창원시";
    const dong = name.endsWith("동") ? name : "상남동";
    fullAddress = `${province} ${city} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, ${city}`;
  } else if (isJeju) {
    x = 25 + offsetX;
    y = 93 + offsetY;
    const city = queryClean.includes("서귀포") ? "서귀포시" : "제주시";
    const dong = name.endsWith("동") ? name : "노형동";
    fullAddress = `제주특별자치도 ${city} ${dong}`;
    englishName = `${dong.replace("동", "")}-dong, Jeju`;
  } else {
    x = 25 + (charCodeSum % 40);
    y = 15 + ((charCodeSum >> 2) % 65);
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

  // Clamping coordinates
  x = Math.max(5, Math.min(95, x));
  y = Math.max(5, Math.min(105, y));

  const temp = 22.0 + parseFloat(((charCodeSum % 110) / 10).toFixed(1));
  const humidity = 50 + (charCodeSum % 46);
  const wind = parseFloat((0.5 + (charCodeSum % 8) / 1.5).toFixed(1));
  const rain = (charCodeSum % 5 === 0) ? parseFloat(((charCodeSum % 15) + 0.5).toFixed(1)) : 0.0;
  const condition = rain > 10.0 ? "thunderstorm" : (rain > 0 ? "rainy" : (humidity > 80 ? "cloudy" : "sunny"));

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
    x: parseFloat(x.toFixed(1)),
    y: parseFloat(y.toFixed(1)),
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
    const name = currentWeather?.name || "선택된 지역";
    const temp = currentWeather?.temp || 26;
    const humidity = currentWeather?.humidity || 65;
    const wind = currentWeather?.wind || 1.5;
    const rain = currentWeather?.rain || 0;
    const condition = currentWeather?.condition || "맑음";

    let reply = `선택하신 ${name} 지역은 현재 기온 ${temp}°C, 습도 ${humidity}%, 풍속 ${wind}m/s, 강수량 ${rain}mm/h로 날씨가 ${condition} 상태입니다. 혹시 오늘 날씨에 따른 옷차림 추천이나 기후 변화 상식, 외출 가이드에 대해 더 궁금한 점이 있으신가요? 편하게 물어보시면 상세히 답변해 드릴게요!`;

    const query = userMsg.toLowerCase();
    if (query.includes("비") || query.includes("우산") || query.includes("장화") || query.includes("비오") || query.includes("강수")) {
      if (rain > 0) {
        reply = `현재 선택된 ${name} 지역은 시간당 ${rain}mm의 비가 실시간으로 내리고 있습니다. ☔ 외출하실 때 튼튼한 우산과 발목을 감싸주는 장화(Rainboots), 또는 미끄럼 방지 신발을 꼭 착용해 안전에 유의해 주세요. 실내 제습도 잊지 마세요!`;
      } else {
        reply = `현재 선택된 ${name} 지역은 다행히 비가 내리고 있지 않고 보송한 상태입니다. ☀️ 다만 최근 기후 변화로 인해 예고 없는 국지성 소나기가 잦게 발생할 수 있으니 가벼운 접이식 우산을 가방에 늘 휴대하고 다니시는 것을 추천드립니다!`;
      }
    } else if (query.includes("더워") || query.includes("더위") || query.includes("여름") || query.includes("온도") || query.includes("기온") || query.includes("날씨")) {
      if (temp >= 28) {
        reply = `현재 ${name}의 기온은 ${temp}°C로 매우 무더운 여름 날씨를 보이고 있습니다. 🔥 열사병과 탈수 예방을 위해 충분한 수분을 정기적으로 섭취해 주시고, 땀 흡수와 통풍이 잘 되는 가벼운 린넨이나 기능성 의류를 착용해 체온을 조절해 주세요.`;
      } else if (temp >= 20) {
        reply = `현재 ${name}의 기온은 ${temp}°C로 바깥 활동을 하기에 정말 완벽한 선선하고 쾌적한 가을/봄 같은 날씨입니다! 🍃 가벼운 티셔츠에 얇은 가디건이나 자켓을 매치한 캐주얼한 의류가 체온 유지와 스타일에 둘 다 좋겠습니다.`;
      } else {
        reply = `현재 ${name}의 기온은 ${temp}°C로 다소 쌀쌀하게 느껴지는 날씨입니다. 🧥 감기에 걸리지 않도록 가디건이나 집업 바람막이, 가벼운 외투를 걸쳐 체온을 따뜻하게 유지하시는 것을 강력히 권장해 드려요!`;
      }
    } else if (query.includes("옷") || query.includes("추천") || query.includes("코디") || query.includes("패션") || query.includes("차림")) {
      if (rain > 0) {
        reply = `현재 비가 오고 있기 때문에 지면이 미끄럽고 옷이 젖기 쉽습니다. 🌧️ 하의는 오염을 방지할 수 있는 어두운 톤의 짧은 기장의 바지나 스커트를 입으시고, 가죽 소재보다는 방수가 되는 윈드브레이커(바람막이)나 장화(레인부츠) 코디를 추천드립니다!`;
      } else if (temp >= 28) {
        reply = `오늘 기온은 ${temp}°C로 무덥기 때문에 통풍성이 훌륭한 반팔 티셔츠, 린넨 셔츠, 숏팬츠를 메인으로 한 시원한 원마일 웨어 코디를 추천합니다. 실내 냉방이 강할 수 있으니 가방에 얇은 셔츠를 준비해 보세요! ☀️`;
      } else {
        reply = `오늘 기온이 ${temp}°C로 선선하므로, 얇은 긴팔 셔츠에 데님 팬츠, 또는 캐주얼 아우터(트렌치 코트, 가벼운 가디건, 블루종)를 활용해 레이어드 룩을 완성해 보시는 걸 강추드려요! 🧥`;
      }
    } else if (query.includes("엘니뇨") || query.includes("라니냐") || query.includes("기후변화") || query.includes("탄소") || query.includes("온난화")) {
      reply = `최근 전 지구적인 온실가스 배출량의 증가와 기후 온난화로 인해 엘니뇨(El Niño)와 라니냐 현상의 변동성이 훨씬 불규칙하고 강해졌습니다. 🌍 이는 한반도에도 전례 없는 집중호우, 태풍 경로의 교란, 극단적 폭염과 한파를 몰고 오고 있죠. 우리 모두 일상 속에서 종이컵 대신 텀블러 쓰기, 대중교통 이용, 쓰지 않는 전원 플러그 뽑기 같은 생활 밀착형 친환경 활동으로 탄소 배출을 줄이는 위대한 여정에 동참해야 합니다!`;
    } else if (query.includes("안녕") || query.includes("하이") || query.includes("반갑") || query.includes("누구")) {
      reply = `반가워요! 저는 기후 변화 시대의 든든한 날씨 길잡이 AI 비서 '클라이밋 버디(Climate Buddy)'입니다. 🌤️ 현재 선택되어 있는 ${name} 지역의 실시간 기상 상태나 맞춤형 패션 코디, 또는 다양한 기후 변화 상식에 대해 무엇이든 편하게 대화 나눠보세요!`;
    } else if (query.includes("검색") || query.includes("지역") || query.includes("동")) {
      reply = `왼쪽 검색바에 '망미동', '여의도', '해운대구 우동' 등 세부 '동'단위 주소나 키워드를 검색해 보세요! 🗺️ 즉시 해당 지역의 정밀한 좌표가 계산되어 지도 위에 시각화되며, 초단기 레이더 강수예측 수치와 맞춤 팁이 새롭게 분석되어 로딩됩니다!`;
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
