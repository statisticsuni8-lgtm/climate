import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Zap,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Activity,
  Compass,
  RefreshCw,
  Sliders,
  X,
  Info,
  Calendar,
  ArrowUpRight,
  Shirt,
  MapPin,
  ChevronRight,
  ThumbsUp,
  Droplets,
  Smartphone,
  Monitor,
  Home,
  Trees
} from "lucide-react";
import {
  regionsData,
  historicalClimateData,
  rcpScenariosData,
  WeatherData
} from "./data";

// Sleek iPhone Mockup Frame Wrapper for Mobile Preview Mode
interface MobileFrameWrapperProps {
  children: React.ReactNode;
  isMobile: boolean;
}

const MobileFrameWrapper = ({ children, isMobile }: MobileFrameWrapperProps) => {
  if (!isMobile) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {children}
      </main>
    );
  }

  return (
    <div className="flex justify-center py-6 px-4">
      {/* Device Body */}
      <div className="relative w-[385px] h-[820px] rounded-[52px] border-[12px] border-slate-300 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)] overflow-hidden flex flex-col ring-1 ring-slate-200">
        
        {/* Notch / Speaker Bar */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-slate-100 rounded-b-xl z-50 flex items-center justify-center border-b border-x border-slate-200">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        
        {/* Mock iPhone Status Bar */}
        <div className="h-9 px-6 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-600 bg-white z-40 select-none shrink-0 border-b border-slate-100">
          <span className="font-semibold text-slate-800">09:41</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-end gap-[1px]">
              <span className="w-[1.2px] h-[3px] bg-slate-500 rounded-sm"></span>
              <span className="w-[1.2px] h-[5px] bg-slate-500 rounded-sm"></span>
              <span className="w-[1.2px] h-[7px] bg-slate-500 rounded-sm"></span>
              <span className="w-[1.2px] h-[9px] bg-slate-500 rounded-sm"></span>
            </span>
            <span className="text-[9px] text-slate-600">5G</span>
            <span className="w-4 h-2.5 border border-slate-400 rounded p-[0.5px] flex items-center">
              <span className="h-full w-2.5 bg-emerald-500 rounded-sm"></span>
            </span>
          </div>
        </div>

        {/* Device Viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white scrollbar-none pb-12 pt-1.5">
          <div className="px-3.5 space-y-4">
            {children}
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-slate-300 rounded-full z-50 pointer-events-none" />
      </div>
    </div>
  );
};

export default function App() {
  // Region & Radar States
  // 지역 설정(★)으로 저장해둔 지역이 있으면 새로고침해도 그 지역으로 시작한다.
  // (이전엔 climate_buddy_home_region_data에 저장은 하면서 시작할 때 읽어오지 않아
  //  "지역 설정"을 눌러도 다시 열면 항상 서울로 초기화되던 버그)
  const [selectedRegion, setSelectedRegion] = useState<WeatherData>(() => {
    try {
      const saved = localStorage.getItem("climate_buddy_home_region_data");
      if (saved) return JSON.parse(saved) as WeatherData;
    } catch {
      /* 저장된 값이 손상된 경우 기본값 사용 */
    }
    return regionsData[0];
  });
  const [radarOn, setRadarOn] = useState<boolean>(true);
  const [forecastStep, setForecastStep] = useState<number>(0);
  const [isPlayingRadar, setIsPlayingRadar] = useState<boolean>(true);

  // 17개 시/도 고정 지역의 "실제" 날씨 값. 처음엔 정적 시드값으로 보여주고
  // 마운트 시 /api/weather/regions로 실제 기상청 값을 받아 덮어쓴다.
  const [liveRegions, setLiveRegions] = useState<WeatherData[]>(regionsData);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/weather/regions");
        if (!res.ok) return;
        const real: Record<string, Partial<WeatherData> | null> = await res.json();
        if (cancelled) return;

        setLiveRegions((prev) =>
          prev.map((reg) => (real[reg.id] ? { ...reg, ...real[reg.id] } : reg))
        );
        setSelectedRegion((prev) => (real[prev.id] ? { ...prev, ...real[prev.id] } : prev));
      } catch {
        /* 실패해도 기존 시드값으로 계속 동작 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Home/Preferred Region State
  const [homeRegionId, setHomeRegionId] = useState<string | null>(() => {
    return localStorage.getItem("climate_buddy_home_region_id");
  });

  // Custom Searched Regions & Search Inputs
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  // 검색으로 추가했던 커스텀 지역들도 매번 사라지지 않도록 복원한다.
  const [customRegions, setCustomRegions] = useState<WeatherData[]>(() => {
    try {
      const saved = localStorage.getItem("climate_buddy_custom_regions");
      return saved ? (JSON.parse(saved) as WeatherData[]) : [];
    } catch {
      return [];
    }
  });
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  // AI Commentary States
  const [aiCommentary, setAiCommentary] = useState<{
    commentary: string;
    clothingRecommendation: string;
    lifestyleTip: string;
    sensoryFeel: string;
    activityRecommendation?: {
      recommended: "outdoor" | "indoor";
      outdoorPlaces: string[];
      indoorPlaces: string[];
    };
  } | null>(null);
  const [isLoadingCommentary, setIsLoadingCommentary] = useState<boolean>(false);

  // Chatbot States
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "안녕하세요! 기후 및 날씨 전문 AI 비서 **클라이밋 버디(Climate Buddy)**입니다. 🌤️\n\n선택하신 지역의 날씨 분석이나 옷차림 추천, 또는 엘니뇨나 탄소 중립 같은 흥미로운 기후 상식에 대해 무엇이든 물어보세요!"
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isTypingChat, setIsTypingChat] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Active Main Tab (Weather Dashboard vs Climate Trends Deep-Dive)
  const [activeTab, setActiveTab] = useState<"weather" | "climate">("weather");

  // Chart Tooltip States
  const [historyTooltipIndex, setHistoryTooltipIndex] = useState<number | null>(null);
  const [rcpTooltipIndex, setRcpTooltipIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load custom regions and home region on mount
  useEffect(() => {
    const savedCustoms = localStorage.getItem("climate_buddy_custom_regions");
    let loadedCustoms: WeatherData[] = [];
    if (savedCustoms) {
      try {
        const parsed = JSON.parse(savedCustoms) as WeatherData[];
        setCustomRegions(parsed);
        loadedCustoms = parsed;
      } catch (e) {
        console.error("Failed to parse custom regions:", e);
      }
    }

    // Recover home region via robust dual-fallback hydrated state
    const savedHomeId = localStorage.getItem("climate_buddy_home_region_id");
    const savedHomeData = localStorage.getItem("climate_buddy_home_region_data");
    
    if (savedHomeData) {
      try {
        const parsedHomeData = JSON.parse(savedHomeData) as WeatherData;
        setSelectedRegion(parsedHomeData);
        // Make sure it is also in customRegions if it is custom
        if (parsedHomeData.id.startsWith("custom-") && !loadedCustoms.some(r => r.id === parsedHomeData.id)) {
          setCustomRegions(prev => [...prev, parsedHomeData]);
        }
      } catch (e) {
        console.error("Failed to parse home region data:", e);
      }
    } else if (savedHomeId) {
      const match = liveRegions.find(r => r.id === savedHomeId);
      if (match) {
        setSelectedRegion(match);
      } else {
        const customMatch = loadedCustoms.find(r => r.id === savedHomeId);
        if (customMatch) {
          setSelectedRegion(customMatch);
        }
      }
    }
  }, []);

  // Save custom regions when changed
  useEffect(() => {
    localStorage.setItem("climate_buddy_custom_regions", JSON.stringify(customRegions));
  }, [customRegions]);

  // Toggle/Set home region
  const handleToggleHomeRegion = (regionId: string) => {
    if (homeRegionId === regionId) {
      setHomeRegionId(null);
      localStorage.removeItem("climate_buddy_home_region_id");
      localStorage.removeItem("climate_buddy_home_region_data");
    } else {
      setHomeRegionId(regionId);
      localStorage.setItem("climate_buddy_home_region_id", regionId);
      localStorage.setItem("climate_buddy_home_region_data", JSON.stringify(selectedRegion));
    }
  };

  // Robust Client-side Fallbacks for Offline/Disconnected Server situations with deep "dong" level support
  const getClientFallbackWeatherData = (query: string): WeatherData => {
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
    const isSeoul = queryLower.includes("서울") || queryLower.includes("강남") || queryLower.includes("강동") || queryLower.includes("강북") || queryLower.includes("관악") || queryLower.includes("광진") || queryLower.includes("구로") || queryLower.includes("금천") || queryLower.includes("노원") || queryLower.includes("도봉") || queryLower.includes("동대문") || queryLower.includes("동작") || queryLower.includes("마포") || queryLower.includes("서대문") || queryLower.includes("서초") || queryLower.includes("성동") || queryLower.includes("성북") || queryLower.includes("송파") || queryLower.includes("양천") || queryLower.includes("영등포") || queryLower.includes("용산") || queryLower.includes("은평") || queryLower.includes("종로") || queryLower.includes("중랑") || queryLower.includes("역삼") || queryLower.includes("삼성") || queryLower.includes("청담") || queryLower.includes("신사") || queryLower.includes("방배") || queryLower.includes("합정") || queryLower.includes("망원") || queryLower.includes("여의도") || queryLower.includes("홍대") || queryLower.includes("잠실") || queryLower.includes("성수") || queryLower.includes("혜화");
    
    const isIncheon = queryLower.includes("인천") || queryLower.includes("송도") || queryLower.includes("부평") || queryLower.includes("구월") || queryLower.includes("미추홀") || queryLower.includes("계양") || queryLower.includes("연수구") || queryLower.includes("강화") || queryLower.includes("옹진");
    
    const isGyeonggi = queryLower.includes("경기") || queryLower.includes("성남") || queryLower.includes("분당") || queryLower.includes("판교") || queryLower.includes("수원") || queryLower.includes("용인") || queryLower.includes("고양") || queryLower.includes("일산") || queryLower.includes("부천") || queryLower.includes("안산") || queryLower.includes("화성") || queryLower.includes("동탄") || queryLower.includes("남양주") || queryLower.includes("평택");

    // 2. Gangwon-do (Northeast)
    const isGangwon = queryLower.includes("강원") || queryLower.includes("강릉") || queryLower.includes("속초") || queryLower.includes("춘천") || queryLower.includes("원주") || queryLower.includes("양양") || queryLower.includes("동해") || queryLower.includes("삼척");

    // 3. Chungcheong-do / Daejeon / Sejong (Center)
    const isDaejeon = queryLower.includes("대전") || queryLower.includes("유성") || queryLower.includes("대덕");
    const isSejong = queryLower.includes("세종");
    const isChungcheong = queryLower.includes("충청") || queryLower.includes("충북") || queryLower.includes("충남") || queryLower.includes("천안") || queryLower.includes("청주") || queryLower.includes("아산") || queryLower.includes("충주");

    // 4. Jeolla-do / Gwangju (Southwest)
    const isGwangju = queryLower.includes("광주") || queryLower.includes("서구 내방로") || queryLower.includes("광산구");
    const isJeolla = queryLower.includes("전라") || queryLower.includes("전북") || queryLower.includes("전남") || queryLower.includes("전주") || queryLower.includes("익산") || queryLower.includes("군산") || queryLower.includes("여수") || queryLower.includes("순천") || queryLower.includes("목포");

    // 5. Gyeongsang-do / Busan / Daegu / Ulsan (Southeast)
    const isBusan = queryLower.includes("부산") || queryLower.includes("해운대") || queryLower.includes("광안") || queryLower.includes("수영") || queryLower.includes("영도") || queryLower.includes("동래") || queryLower.includes("남포") || queryLower.includes("금정") || queryLower.includes("사상") || queryLower.includes("사하") || queryLower.includes("연제") || queryLower.includes("부산진") || queryLower.includes("기장");
    const isDaegu = queryLower.includes("대구") || queryLower.includes("수성") || queryLower.includes("달서") || queryLower.includes("달성");
    const isUlsan = queryLower.includes("울산") || queryLower.includes("울주");
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
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `서울특별시 ${district} ${dong}` : `서울특별시 ${district}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, Seoul` : `Seoul`;
    } else if (isIncheon) {
      x = 26 + offsetX;
      y = 22 + offsetY;
      const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "연수구" : "연수구";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `인천광역시 ${district} ${dong}` : `인천광역시 ${district}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, Incheon` : `Incheon`;
    } else if (isGyeonggi) {
      x = 38 + offsetX;
      y = 26 + offsetY;
      const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "성남시" : "성남시";
      const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "분당구" : "분당구";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `경기도 ${city} ${district} ${dong}` : `경기도 ${city} ${district}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, ${city}` : `${city}`;
    } else if (isBusan) {
      x = 64 + offsetX;
      y = 68 + offsetY;
      const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "해운대구" : "해운대구";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `부산광역시 ${district} ${dong}` : `부산광역시 ${district}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, Busan` : `Busan`;
    } else if (isDaegu) {
      x = 58 + offsetX;
      y = 53 + offsetY;
      const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "수성구" : "수성구";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `대구광역시 ${district} ${dong}` : `대구광역시 ${district}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, Daegu` : `Daegu`;
    } else if (isUlsan) {
      x = 69 + offsetX;
      y = 58 + offsetY;
      const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "남구" : "남구";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `울산광역시 ${district} ${dong}` : `울산광역시 ${district}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, Ulsan` : `Ulsan`;
    } else if (isDaejeon) {
      x = 40 + offsetX;
      y = 44 + offsetY;
      const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "유성구" : "유성구";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `대전광역시 ${district} ${dong}` : `대전광역시 ${district}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, Daejeon` : `Daejeon`;
    } else if (isSejong) {
      x = 37 + offsetX;
      y = 39 + offsetY;
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `세종특별자치시 ${dong}` : `세종특별자치시`;
      englishName = dong ? `${dong.replace("동", "")}-dong, Sejong` : `Sejong`;
    } else if (isGangwon) {
      x = 60 + offsetX;
      y = 18 + offsetY;
      const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "강릉시" : "강릉시";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `강원특별자치도 ${city} ${dong}` : `강원특별자치도 ${city}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, ${city}` : `${city}`;
    } else if (isChungcheong) {
      x = 42 + offsetX;
      y = 41 + offsetY;
      const province = queryLower.includes("충북") ? "충청북도" : "충청남도";
      const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "천안시" : "천안시";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `${province} ${city} ${dong}` : `${province} ${city}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, ${city}` : `${city}`;
    } else if (isGwangju) {
      x = 28 + offsetX;
      y = 67 + offsetY;
      const district = queryClean.includes("구") ? parts.find(p => p.endsWith("구")) || "북구" : "북구";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `광주광역시 ${district} ${dong}` : `광주광역시 ${district}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, Gwangju` : `Gwangju`;
    } else if (isJeolla) {
      x = 26 + offsetX;
      y = 64 + offsetY;
      const province = queryLower.includes("전북") ? "전라북도" : "전라남도";
      const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "전주시" : "전주시";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `${province} ${city} ${dong}` : `${province} ${city}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, ${city}` : `${city}`;
    } else if (isGyeongsang) {
      x = 64 + offsetX;
      y = 52 + offsetY;
      const province = queryLower.includes("경북") ? "경상북도" : "경상남도";
      const city = queryClean.includes("시") ? parts.find(p => p.endsWith("시")) || "포항시" : "창원시";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `${province} ${city} ${dong}` : `${province} ${city}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, ${city}` : `${city}`;
    } else if (isJeju) {
      x = 25 + offsetX;
      y = 93 + offsetY;
      const city = queryClean.includes("서귀포") ? "서귀포시" : "제주시";
      const dong = name.endsWith("동") ? name : "";
      fullAddress = dong ? `제주특별자치도 ${city} ${dong}` : `제주특별자치도 ${city}`;
      englishName = dong ? `${dong.replace("동", "")}-dong, Jeju` : `Jeju`;
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
  };

  const getClientFallbackCommentary = (region: WeatherData) => {
    const isRainy = region.rain > 0;
    const di = Math.round(1.8 * region.temp - 0.55 * (1 - region.humidity / 100) * (1.8 * region.temp - 26) + 32);
    let feel = "쾌적해요";
    if (di >= 80) feel = "매우 후텁지근해요";
    else if (di >= 75) feel = "조금 끈적여요";
    else if (region.temp < 15) feel = "쌀쌀하고 선선해요";
    
    return {
      commentary: `${region.name} 지역은 현재 기온 ${region.temp}°C, 습도 ${region.humidity}%로 공기의 흐름이 조화를 이루고 있습니다. ${isRainy ? "내리는 빗방울과 함께 시원한 바람이 체감 온도를 조절해 주네요." : "화창하고 선선한 기상 상태를 만끽해 보세요."}`,
      clothingRecommendation: isRainy ? "비가 내려 지면이 젖었으니 튼튼한 장화(Rainboots)나 미끄럼 방지 슈즈를 추천드려요." : "쾌적하고 얇은 자켓이나 가디건을 매치해 체온을 일정하게 유지해보세요.",
      lifestyleTip: isRainy ? "실내 환기는 잠시 미루고 제습기나 에어컨 제습 모드를 가동하는 것이 집안을 보송하게 유지하는 꿀팁입니다." : "실외 환기를 하기 딱 좋은 타이밍입니다! 30분간 환기를 시켜 실내 공기를 정화해 보세요.",
      sensoryFeel: feel
    };
  };

  const getClientFallbackChatReply = (userMsg: string, region: WeatherData) => {
    const name = region.name || "선택된 지역";
    const temp = region.temp || 26;
    const humidity = region.humidity || 65;
    const wind = region.wind || 1.5;
    const rain = region.rain || 0;
    const condition = region.condition || "sunny";

    let reply = `선택하신 ${name} 지역은 현재 기온 ${temp}°C, 습도 ${humidity}%, 풍속 ${wind}m/s, 강수량 ${rain}mm/h 상태입니다. 혹시 오늘 날씨에 따른 옷차림 추천이나 기후 변화 상식, 외출 가이드에 대해 더 궁금한 점이 있으신가요? 편하게 물어보시면 상세히 답변해 드릴게요!`;

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

    return reply;
  };

  // Auto-play interval for radar heatmap
  useEffect(() => {
    let interval: any;
    if (isPlayingRadar && radarOn) {
      interval = setInterval(() => {
        setForecastStep((prev) => (prev + 1) % 6);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlayingRadar, radarOn]);

  // Fetch AI commentary when selected region changes
  useEffect(() => {
    fetchWeatherCommentary(selectedRegion);
  }, [selectedRegion]);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTypingChat]);

  // API Call: Fetch custom AI weather commentary
  const fetchWeatherCommentary = async (region: WeatherData) => {
    setIsLoadingCommentary(true);
    try {
      const response = await fetch("/api/weather/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: region.name,
          temp: region.temp,
          humidity: region.humidity,
          wind: region.wind,
          condition: region.condition,
          rain: region.rain
        })
      });
      if (!response.ok) {
        throw new Error("Commentary request failed");
      }
      const data = await response.json();
      setAiCommentary(data);
    } catch (error) {
      console.error("Error fetching commentary, falling back locally:", error);
      setAiCommentary(getClientFallbackCommentary(region));
    } finally {
      setIsLoadingCommentary(false);
    }
  };

  // API Call: Search custom location/address
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      // First check if it matches a local region in regionsData
      const queryLower = searchQuery.trim().toLowerCase();
      const localMatch = liveRegions.find(
        (reg) =>
          reg.name.toLowerCase().includes(queryLower) ||
          reg.englishName.toLowerCase().includes(queryLower)
      );

      if (localMatch) {
        setSelectedRegion(localMatch);
        setSearchQuery("");
        setIsSearching(false);
        return;
      }

      // Check existing custom regions
      const existingCustomMatch = customRegions.find(
        (reg) =>
          reg.name.toLowerCase().includes(queryLower) ||
          reg.englishName.toLowerCase().includes(queryLower) ||
          (reg.fullAddress && reg.fullAddress.toLowerCase().includes(queryLower))
      );

      if (existingCustomMatch) {
        setSelectedRegion(existingCustomMatch);
        setSearchQuery("");
        setIsSearching(false);
        return;
      }

      const response = await fetch("/api/weather/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() })
      });

      if (!response.ok) {
        throw new Error("위치를 찾지 못했습니다.");
      }

      const data = await response.json();
      if (data && data.name && data.x && data.y) {
        setCustomRegions((prev) => [...prev, data]);
        setSelectedRegion(data);
        setSearchQuery("");
      } else {
        // Trigger local geocoding fallback
        const fallbackData = getClientFallbackWeatherData(searchQuery);
        setCustomRegions((prev) => [...prev, fallbackData]);
        setSelectedRegion(fallbackData);
        setSearchQuery("");
      }
    } catch (error: any) {
      console.error("Search error, falling back to local geocoder:", error);
      const fallbackData = getClientFallbackWeatherData(searchQuery);
      setCustomRegions((prev) => [...prev, fallbackData]);
      setSelectedRegion(fallbackData);
      setSearchQuery("");
    } finally {
      setIsSearching(false);
    }
  };

  // API Call: Chat response
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTypingChat(true);

    try {
      const response = await fetch("/api/weather/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages.slice(-5), { role: "user", content: userMessage }].map((msg) => ({
            role: msg.role,
            content: msg.content
          })),
          currentWeather: {
            name: selectedRegion.name,
            temp: selectedRegion.temp,
            humidity: selectedRegion.humidity,
            wind: selectedRegion.wind,
            rain: selectedRegion.rain,
            condition: translateCondition(selectedRegion.condition)
          }
        })
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (error) {
      console.error("Error sending chat message, falling back locally:", error);
      const fallbackReply = getClientFallbackChatReply(userMessage, selectedRegion);
      setChatMessages((prev) => [...prev, { role: "assistant", content: fallbackReply }]);
    } finally {
      setIsTypingChat(false);
    }
  };

  // Interactively adjust precipitation for the selected region (Ultra-short-term precipitation forecast simulator)
  const handlePrecipitationChange = (newRain: number) => {
    const updated = {
      ...selectedRegion,
      rain: newRain,
      radarForecast: [
        newRain,
        Math.max(0, parseFloat((newRain * 1.1 + (newRain > 0 ? 0.3 : 0)).toFixed(1))),
        Math.max(0, parseFloat((newRain * 1.3 + (newRain > 0 ? 0.6 : 0)).toFixed(1))),
        Math.max(0, parseFloat((newRain * 0.7).toFixed(1))),
        Math.max(0, parseFloat((newRain * 0.3).toFixed(1))),
        Math.max(0, parseFloat((newRain * 0.05).toFixed(1))),
      ],
      condition: newRain === 0
        ? (selectedRegion.condition === "rainy" || selectedRegion.condition === "thunderstorm" ? "cloudy" : selectedRegion.condition)
        : (newRain > 15 ? "thunderstorm" : "rainy") as any
    };
    setSelectedRegion(updated);
    
    // update customRegions as well if it exists there
    if (customRegions.some(r => r.id === selectedRegion.id)) {
      setCustomRegions(prev => prev.map(r => r.id === selectedRegion.id ? updated : r));
    }
  };

  // Helper: Calculate Discomfort Index (불쾌지수)
  const calculateDiscomfortIndex = (temp: number, humidity: number) => {
    const di = 1.8 * temp - 0.55 * (1 - humidity / 100) * (1.8 * temp - 26) + 32;
    let level = "낮음";
    let color = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    let fill = "stroke-emerald-400";
    let desc = "대다수 사람들이 쾌적함을 느낍니다.";

    if (di >= 80) {
      level = "매우높음";
      color = "text-rose-400 bg-rose-500/10 border-rose-500/20 neon-glow-warning";
      fill = "stroke-rose-400";
      desc = "전원이 불쾌감을 느낄 수 있는 극심한 후텁지근함입니다. 제습과 실내 냉방이 적극 권장됩니다.";
    } else if (di >= 75) {
      level = "높음";
      color = "text-amber-400 bg-amber-500/10 border-amber-500/20";
      fill = "stroke-amber-400";
      desc = "약 50%의 사람들이 불쾌감을 느낍니다. 수분 섭취와 가벼운 통풍성 의류를 챙기세요.";
    } else if (di >= 68) {
      level = "보통";
      color = "text-sky-400 bg-sky-500/10 border-sky-500/20";
      fill = "stroke-sky-400";
      desc = "일부 예민한 사람들이 가벼운 불쾌감을 느낄 수 있습니다.";
    }

    return { value: Math.round(di), level, color, fill, desc };
  };

  const diInfo = calculateDiscomfortIndex(selectedRegion.temp, selectedRegion.humidity);

  // Helper: Translate weather conditions to Korean
  const translateCondition = (cond: string) => {
    switch (cond) {
      case "sunny":
        return "맑음";
      case "cloudy":
        return "구름많음";
      case "rainy":
        return "비";
      case "windy":
        return "바람강함";
      case "thunderstorm":
        return "뇌우/호우";
      default:
        return "흐림";
    }
  };

  // Helper: Weather Icons
  const getWeatherIcon = (cond: string, sizeClass = "w-6 h-6") => {
    switch (cond) {
      case "sunny":
        return <Sun className={`${sizeClass} text-amber-400`} />;
      case "cloudy":
        return <Cloud className={`${sizeClass} text-slate-400`} />;
      case "rainy":
        return <CloudRain className={`${sizeClass} text-sky-400`} />;
      case "windy":
        return <Wind className={`${sizeClass} text-teal-400`} />;
      case "thunderstorm":
        return <Zap className={`${sizeClass} text-yellow-400`} />;
      default:
        return <Cloud className={`${sizeClass} text-slate-400`} />;
    }
  };

  // Helper: Get color for radar precipitation level (Korea Meteorological Administration Standard Color Codes)
  const getPrecipitationColor = (rain: number) => {
    if (rain === 0) return "rgba(0,0,0,0)";
    if (rain < 1.0) return "rgba(165, 243, 252, 0.5)"; // 약한 비 (연한 하늘색, #a5f3fc)
    if (rain < 5.0) return "rgba(2, 132, 199, 0.65)";  // 보통 비 (파란색, #0284c7)
    if (rain < 10.0) return "rgba(245, 158, 11, 0.75)"; // 강한 비 (주황색, #f59e0b)
    if (rain < 20.0) return "rgba(239, 68, 68, 0.85)";  // 매우 강한 비 (빨간색, #ef4444)
    return "rgba(168, 85, 247, 0.9)";                  // 폭우 / 극한 강수 (보라색, #a855f7)
  };

  // Quick prompt shortcuts for AI chatbot
  const chatShortcuts = [
    { text: "장화 신을까?", prompt: "오늘 날씨에 장화나 우산 챙겨야 할까?" },
    { text: "불쾌지수 극복법", prompt: "오늘 불쾌지수 단계가 어떤지 알려주고 쾌적하게 지낼 수 있는 꿀팁 3가지만 추천해줘." },
    { text: "우리나라 기후 위기", prompt: "한국의 평균 기온이 지구 온난화로 얼마나 빨리 오르고 있나요?" },
    { text: "RCP 시나리오란?", prompt: "기후 예측에 자주 쓰이는 RCP 4.5와 RCP 8.5 시나리오의 차이를 알기 쉽게 요약해 줘." }
  ];

  const triggerShortcut = (promptText: string) => {
    setChatInput(promptText);
  };

  // Radar step label mappings
  const radarStepLabels = ["현재", "+1시간", "+2시간", "+3시간", "+4시간", "+6시간"];

  return (
    <div id="app_root" className="min-h-screen bg-white text-slate-800 font-sans selection:bg-sky-500/15 selection:text-sky-800 overflow-x-hidden pb-12">
      
      {/* 1. Atmospheric Grid Glow Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-indigo-400/3 rounded-full blur-[140px] pointer-events-none" />

      {/* 2. Top Sleek Command Header */}
      <header id="header_section" className="relative border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 rounded-xl border border-sky-200 animate-pulse">
              <Activity className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-widest text-sky-600 font-semibold uppercase">National Climate Intel</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-mono rounded text-slate-600 border border-slate-200">V2.5 Live</span>
              </div>
              <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-slate-900 flex items-center gap-2">
                기후 예측 및 AI 브리핑 <span className="text-sm font-normal text-slate-500">| Radar & Assistant</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Main Tabs switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="tab_weather_btn"
                onClick={() => setActiveTab("weather")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "weather"
                    ? "bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/10"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                초단기 예측 & 스타일링
              </button>
              <button
                id="tab_climate_btn"
                onClick={() => setActiveTab("climate")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "climate"
                    ? "bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/10"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                기후변화 트렌드 분석
              </button>
            </div>

            {/* Quick Chat Switch */}
            <button
              id="header_chat_toggle"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="relative p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 rounded-xl border border-slate-200 transition-all flex items-center gap-2 text-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-sky-600 animate-bounce" />
              <span className="hidden sm:inline">AI 비서</span>
              {chatMessages.length > 1 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {chatMessages.length - 1}
                </span>
              )}
            </button>

            {/* Mobile Device Mockup View Switch */}
            <button
              id="header_device_toggle"
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs cursor-pointer ${
                isMobileFrame 
                  ? "bg-purple-100 border-purple-200 text-purple-700 hover:text-purple-900"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              }`}
              title={isMobileFrame ? "데스크톱 전체 뷰로 전환" : "아이폰 모바일 앱 뷰로 전환"}
            >
              {isMobileFrame ? (
                <Monitor className="w-4 h-4 text-purple-400" />
              ) : (
                <Smartphone className="w-4 h-4 text-purple-400 animate-pulse" />
              )}
              <span className="hidden sm:inline">
                {isMobileFrame ? "데스크톱 뷰" : "모바일 앱 뷰"}
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. Main Dashboard Layout Container */}
      <MobileFrameWrapper isMobile={isMobileFrame}>
        
        {/* TAB 1: Weather Dashboard & Radar */}
        {activeTab === "weather" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT AREA: Korea Forecast Radar Map (Col-span 5) */}
            <section id="radar_map_section" className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 relative overflow-hidden flex flex-col h-[650px] shadow-sm">
              
              <div className="flex items-center justify-between mb-4 z-10">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-600" />
                    초단기 강수예측 레이더
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">남한 전역 실시간 및 6시간 강수 시뮬레이션</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">Radar FX Overlay</span>
                  <button
                    id="toggle_radar_btn"
                    onClick={() => setRadarOn(!radarOn)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      radarOn ? "bg-sky-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        radarOn ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Region/Address Search Input */}
              <div className="mb-3.5 z-10">
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      placeholder="지역명, 동, 구 또는 상세 주소 검색..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8.5 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500/20 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>검색</span>
                  </button>
                </div>
                {searchError && (
                  <p className="text-[10px] text-rose-500 mt-1 pl-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {searchError}
                  </p>
                )}

                {/* Home Region & Preset Quick Access Links */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">단축 설정:</span>
                  {homeRegionId ? (
                    (() => {
                      const homeReg = liveRegions.find(r => r.id === homeRegionId) || customRegions.find(r => r.id === homeRegionId);
                      if (homeReg) {
                        return (
                          <button
                            onClick={() => setSelectedRegion(homeReg)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              selectedRegion.id === homeReg.id
                                ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
                                : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <span className="text-amber-500">★</span>
                            <span>{homeReg.name} (기본)</span>
                          </button>
                        );
                      }
                      return null;
                    })()
                  ) : (
                    <span className="text-[9px] text-slate-400 italic">지정된 기본 지역 없음</span>
                  )}

                  {/* Show preset popular regions for ease of navigation */}
                  {liveRegions.slice(0, 3).map((reg) => (
                    <button
                      key={`preset-quick-${reg.id}`}
                      onClick={() => setSelectedRegion(reg)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium cursor-pointer transition-all ${
                        selectedRegion.id === reg.id
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {reg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Tech Interactive Map View Area */}
              <div className="relative flex-1 bg-sky-50/20 rounded-xl border border-slate-200/80 overflow-hidden flex items-center justify-center">
                
                {/* Radar sweep light effect */}
                {radarOn && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                    <svg className="w-full h-full max-w-[400px] max-h-[400px] radar-sweep-effect" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(14, 165, 233, 0.15)" strokeWidth="0.5" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(14, 165, 233, 0.1)" strokeWidth="0.5" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(14, 165, 233, 0.05)" strokeWidth="0.5" />
                      <line x1="50" y1="50" x2="50" y2="2" stroke="url(#radar-grad)" strokeWidth="1.5" />
                      <defs>
                        <linearGradient id="radar-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="transparent" />
                          <stop offset="80%" stopColor="rgba(56, 189, 248, 0.1)" />
                          <stop offset="100%" stopColor="rgba(56, 189, 248, 0.9)" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}

                {/* Simulated Geographic SVG Map of South Korea */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-full h-full max-w-[340px] max-h-[500px]" viewBox="0 0 100 110">
                    
                    {/* Ocean background styling inside the map */}
                    <rect x="0" y="0" width="100" height="110" fill="#f0f9ff" rx="12" />

                    {/* Background Grid Coordinates */}
                    <g opacity="0.4">
                      <line x1="10" y1="0" x2="10" y2="110" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="30" y1="0" x2="30" y2="110" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="50" y1="0" x2="50" y2="110" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="70" y1="0" x2="70" y2="110" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="90" y1="0" x2="90" y2="110" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                      
                      <line x1="0" y1="20" x2="100" y2="20" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="0" y1="40" x2="100" y2="40" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="0" y1="60" x2="100" y2="60" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="0" y1="80" x2="100" y2="80" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="0" y1="100" x2="100" y2="100" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,2" />
                    </g>

                    {/* Highly stylized simplified map contour connecting major regions */}
                    <path
                      d="M 33 15 L 43 14 L 62 13 L 64 22 L 60 28 L 68 40 L 73 52 L 75 58 L 71 67 L 66 73 L 53 73 L 42 75 L 30 76 L 20 73 L 18 64 L 28 54 L 20 44 L 22 34 L 18 24 L 28 20 Z"
                      fill="#e2e8f0"
                      stroke="#cbd5e1"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                    />

                    {/* Simulated RADAR CLOUD HEATMAP cell rings (toggled under radarOn) */}
                    {radarOn && (
                      <g>
                        {liveRegions.map((reg) => {
                          const stepsPrecipitation = reg.radarForecast[forecastStep];
                          if (stepsPrecipitation === 0) return null;

                          // Pulse animation size based on rain intensity
                          const pulseRadius = 5 + (stepsPrecipitation * 0.8);
                          const color = getPrecipitationColor(stepsPrecipitation);

                          return (
                            <g key={`radar-${reg.id}`}>
                              {/* Glowing cell overlay */}
                              <circle
                                cx={reg.x}
                                cy={reg.y}
                                r={pulseRadius}
                                fill={color}
                                className="transition-all duration-1000 ease-in-out"
                                opacity="0.35"
                              />
                              <circle
                                cx={reg.x}
                                cy={reg.y}
                                r={pulseRadius * 0.6}
                                fill="none"
                                stroke={color}
                                strokeWidth="0.5"
                                className="animate-ping"
                                style={{ animationDuration: `${3 - Math.min(2.5, stepsPrecipitation * 0.1)}s` }}
                              />
                            </g>
                          );
                        })}
                        {customRegions.map((reg) => {
                          const stepsPrecipitation = reg.radarForecast[forecastStep];
                          if (stepsPrecipitation === 0) return null;

                          // Pulse animation size based on rain intensity
                          const pulseRadius = 5 + (stepsPrecipitation * 0.8);
                          const color = getPrecipitationColor(stepsPrecipitation);

                          return (
                            <g key={`radar-custom-${reg.id}`}>
                              {/* Glowing cell overlay */}
                              <circle
                                cx={reg.x}
                                cy={reg.y}
                                r={pulseRadius}
                                fill={color}
                                className="transition-all duration-1000 ease-in-out"
                                opacity="0.35"
                              />
                              <circle
                                cx={reg.x}
                                cy={reg.y}
                                r={pulseRadius * 0.6}
                                fill="none"
                                stroke={color}
                                strokeWidth="0.5"
                                className="animate-ping"
                                style={{ animationDuration: `${3 - Math.min(2.5, stepsPrecipitation * 0.1)}s` }}
                              />
                            </g>
                          );
                        })}
                      </g>
                    )}

                    {/* Regional Interactive Interactive Pins */}
                    {liveRegions.map((reg) => {
                      const isSelected = selectedRegion.id === reg.id;
                      const hasRain = reg.rain > 0;
                      const isHome = homeRegionId === reg.id;
                      
                      return (
                        <g
                          key={reg.id}
                          className="cursor-pointer group"
                          onClick={() => setSelectedRegion(reg)}
                        >
                          {/* Outer glowing pulsing aura for selected region */}
                          {isSelected && (
                            <circle
                              cx={reg.x}
                              cy={reg.y}
                              r="4.5"
                              fill="none"
                              stroke={isHome ? "#f59e0b" : "#0ea5e9"}
                              strokeWidth="0.75"
                              className="animate-pulse"
                            />
                          )}

                          {/* Pin dot */}
                          <circle
                            cx={reg.x}
                            cy={reg.y}
                            r={isSelected ? "2.5" : "1.8"}
                            fill={isSelected ? (isHome ? "#fbbf24" : "#38bdf8") : isHome ? "#d97706" : hasRain ? "#0284c7" : "#475569"}
                            stroke="rgba(15, 23, 42, 0.9)"
                            strokeWidth="0.5"
                            className="transition-all duration-300 group-hover:scale-125 group-hover:fill-sky-400"
                          />

                          {/* Hover text / dynamic text tags next to nodes */}
                          <text
                            x={reg.x + (reg.x > 60 ? -3 : 3)}
                            y={reg.y + 1}
                            textAnchor={reg.x > 60 ? "end" : "start"}
                            fill={isSelected ? "#f8fafc" : isHome ? "#fbbf24" : "#94a3b8"}
                            fontSize="3"
                            fontFamily="sans-serif"
                            fontWeight={isSelected || isHome ? "bold" : "normal"}
                            className="pointer-events-none select-none transition-all duration-300"
                          >
                            {isHome ? "★ " : ""}{reg.name}
                            {isSelected && ` (${reg.temp}°)`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Custom Searched Pins */}
                    {customRegions.map((reg) => {
                      const isSelected = selectedRegion.id === reg.id;
                      const hasRain = reg.rain > 0;
                      const isHome = homeRegionId === reg.id;
                      
                      return (
                        <g
                          key={reg.id}
                          className="cursor-pointer group"
                          onClick={() => setSelectedRegion(reg)}
                        >
                          {/* Outer glowing pulsing aura for selected region */}
                          {isSelected && (
                            <circle
                              cx={reg.x}
                              cy={reg.y}
                              r="4.5"
                              fill="none"
                              stroke={isHome ? "#f59e0b" : "#c084fc"}
                              strokeWidth="0.75"
                              className="animate-pulse"
                            />
                          )}

                          {/* Pin dot */}
                          <circle
                            cx={reg.x}
                            cy={reg.y}
                            r={isSelected ? "2.5" : "1.8"}
                            fill={isSelected ? (isHome ? "#fbbf24" : "#e9d5ff") : isHome ? "#d97706" : hasRain ? "#c084fc" : "#a855f7"}
                            stroke="rgba(15, 23, 42, 0.9)"
                            strokeWidth="0.5"
                            className="transition-all duration-300 group-hover:scale-125 group-hover:fill-purple-300"
                          />

                          {/* Hover text next to nodes */}
                          <text
                            x={reg.x + (reg.x > 60 ? -3 : 3)}
                            y={reg.y + 1}
                            textAnchor={reg.x > 60 ? "end" : "start"}
                            fill={isSelected ? "#f3e8ff" : isHome ? "#fbbf24" : "#d8b4fe"}
                            fontSize="3"
                            fontFamily="sans-serif"
                            fontWeight={isSelected || isHome ? "bold" : "normal"}
                            className="pointer-events-none select-none transition-all duration-300"
                          >
                            {isHome ? "★ " : ""}{reg.name}
                            {isSelected && ` (${reg.temp}°)`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Styled Dokdo & Ulleungdo indicator box */}
                    <g transform="translate(80, 30)" opacity="0.8">
                      <rect x="0" y="0" width="15" height="12" fill="rgba(15,23,42,0.4)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" rx="1" />
                      <circle cx="5" cy="6" r="1.2" fill="#475569" />
                      <text x="5" y="10" fontSize="2.2" fill="#64748b" textAnchor="middle">울릉</text>
                      <circle cx="11" cy="5" r="0.8" fill="#475569" />
                      <text x="11" y="10" fontSize="2.2" fill="#64748b" textAnchor="middle">독도</text>
                    </g>

                  </svg>
                </div>

                {/* Bottom Left: Heatmap Legend Scale */}
                {radarOn && (
                  <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-200 p-2 rounded-lg backdrop-blur-sm z-10 shadow-sm">
                    <div className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-wider mb-1">강수강도 (강수예측 레이더)</div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-700">
                          <span className="w-2.5 h-1.5 rounded block" style={{ backgroundColor: "rgba(168, 85, 247, 0.9)" }}></span>
                          <span>&gt; 20 mm/h (폭우/극한)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-700">
                          <span className="w-2.5 h-1.5 rounded block" style={{ backgroundColor: "rgba(239, 68, 68, 0.85)" }}></span>
                          <span>10 - 20 mm/h (매우 강한 비)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-700">
                          <span className="w-2.5 h-1.5 rounded block" style={{ backgroundColor: "rgba(245, 158, 11, 0.75)" }}></span>
                          <span>5 - 10 mm/h (강한 비)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-700">
                          <span className="w-2.5 h-1.5 rounded block" style={{ backgroundColor: "rgba(2, 132, 199, 0.65)" }}></span>
                          <span>1 - 5 mm/h (보통 비)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-700">
                          <span className="w-2.5 h-1.5 rounded block" style={{ backgroundColor: "rgba(165, 243, 252, 0.8)" }}></span>
                          <span>0.1 - 1 mm/h (약한 비)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Right: Selection indicator */}
                <div className="absolute bottom-3 right-3 bg-white/95 border border-sky-200 px-3 py-1.5 rounded-lg z-10 flex items-center gap-2 max-w-[240px] shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[8px] font-mono text-slate-500">SELECTED REGION</div>
                    <div className="text-xs font-bold text-slate-900 leading-none truncate">{selectedRegion.name} ({selectedRegion.englishName})</div>
                    {selectedRegion.fullAddress && (
                      <div className="text-[9px] text-slate-500 truncate mt-1" title={selectedRegion.fullAddress}>
                        {selectedRegion.fullAddress}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Slider & Play Controls for Ultra Short Term Radar */}
              <div id="radar_timeline_controls" className="mt-4 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                
                <div className="flex items-center justify-between gap-4 mb-2">
                  
                  <div className="flex items-center gap-2">
                    <button
                      id="play_pause_radar_btn"
                      onClick={() => setIsPlayingRadar(!isPlayingRadar)}
                      className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors cursor-pointer"
                      title={isPlayingRadar ? "자동재생 일시정지" : "레이더 시뮬레이션 재생"}
                    >
                      {isPlayingRadar ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    
                    <button
                      id="reset_radar_step_btn"
                      onClick={() => { setForecastStep(0); setIsPlayingRadar(false); }}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      title="현재 시각으로 리셋"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Highlight step */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Predictive Step</span>
                    <div className="text-xs font-bold text-sky-600 font-mono">
                      {radarStepLabels[forecastStep]} ({forecastStep === 0 ? "현재 관측" : `+${forecastStep === 5 ? 6 : forecastStep}시간 후 예측`})
                    </div>
                  </div>

                </div>

                {/* Timeline bar selector */}
                <div className="flex items-center justify-between gap-1">
                  {radarStepLabels.map((lbl, idx) => {
                    const isActive = forecastStep === idx;
                    return (
                      <button
                        key={`timeline-step-${idx}`}
                        onClick={() => { setForecastStep(idx); setIsPlayingRadar(false); }}
                        className={`flex-1 py-1 text-[10px] font-semibold rounded-md border transition-all duration-300 cursor-pointer ${
                          isActive
                            ? "bg-sky-100 text-sky-700 border-sky-300 font-bold shadow-sm"
                            : "bg-slate-50 text-slate-500 border-slate-100 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>

              </div>

            </section>

            {/* RIGHT AREA: AI Weather Commentary & Lifestyle Stylist Bento Box (Col-span 7) */}
            <section className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Region Overview Header Block */}
              <div id="region_weather_header_card" className="bg-gradient-to-r from-sky-500 to-indigo-600 border border-transparent p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-white/15 rounded-2xl border border-white/20">
                    {getWeatherIcon(selectedRegion.condition, "w-10 h-10")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold tracking-tight text-white">{selectedRegion.name}</h2>
                      <span className="text-xs font-mono text-sky-100 font-semibold">{selectedRegion.englishName}</span>
                      
                      <button
                        onClick={() => handleToggleHomeRegion(selectedRegion.id)}
                        className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                          homeRegionId === selectedRegion.id
                            ? "bg-amber-400 border-amber-300 text-slate-900 shadow-sm font-bold"
                            : "bg-white/15 border-white/20 text-white hover:bg-white/25 hover:border-white/30"
                        }`}
                        title={homeRegionId === selectedRegion.id ? "기본 설정 지역 해제" : "기본 설정 지역으로 지정"}
                      >
                        {homeRegionId === selectedRegion.id ? "★ 기본 지역" : "☆ 지역 설정"}
                      </button>
                    </div>
                    {selectedRegion.fullAddress && (
                      <div className="text-[11px] text-sky-100/90 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 text-sky-100" />
                        <span>{selectedRegion.fullAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-sky-100 font-medium">
                      <span>체감 기상: </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-sky-700 shadow-sm border border-sky-100`}>
                        {aiCommentary?.sensoryFeel || translateCondition(selectedRegion.condition)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core parameters metrics bar */}
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                  <div className="text-center">
                    <span className="text-[10px] text-sky-100 font-mono block uppercase opacity-85">TEMPERATURE</span>
                    <span className="text-2xl font-display font-semibold text-white tracking-tight">{selectedRegion.temp}°C</span>
                  </div>
                  <div className="text-center border-l border-white/10 pl-4 sm:pl-6">
                    <span className="text-[10px] text-sky-100 font-mono block uppercase opacity-85">HUMIDITY</span>
                    <span className="text-2xl font-display font-semibold text-white tracking-tight">{selectedRegion.humidity}%</span>
                  </div>
                  <div className="text-center border-l border-white/10 pl-4 sm:pl-6">
                    <span className="text-[10px] text-sky-100 font-mono block uppercase opacity-85">PRECIPITATION</span>
                    <span className="text-2xl font-display font-semibold text-white tracking-tight">{selectedRegion.rain} mm</span>
                  </div>
                </div>

              </div>

              {/* Bento Grid: AI Content & Index gauges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Large Bento Box: AI climate analyst advice */}
                <div id="ai_commentary_card" className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden min-h-[220px] flex flex-col justify-between shadow-sm">
                  <div className="absolute top-0 right-0 p-3">
                    <Sparkles className="w-5 h-5 text-sky-500 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-xs font-mono text-sky-600 font-bold uppercase tracking-wider mb-2">AI Climate Analyst Commentary</h3>
                    
                    {isLoadingCommentary ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
                        <p className="text-xs text-slate-500 font-mono animate-pulse">Gemini-3.5가 실시간 날씨 데이터 및 불쾌지수를 심층 분석하는 중...</p>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <p className="text-sm md:text-base leading-relaxed text-slate-700 font-medium">
                          {aiCommentary?.commentary || `${selectedRegion.name} 지역은 현재 기온 ${selectedRegion.temp}°C에 습도 ${selectedRegion.humidity}%로 후텁지근한 상태입니다. 기후 예측 모델에 따라 비구름의 유동성을 예의주시하고 있습니다.`}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {!isLoadingCommentary && aiCommentary?.lifestyleTip && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold shrink-0">클라이밋 팁</span>
                      <p className="text-slate-500 italic">{aiCommentary.lifestyleTip}</p>
                    </div>
                  )}

                </div>

                {/* 2. Style & Fashion recommendation Card */}
                <div id="lifestyle_fashion_card" className="bg-white border border-slate-200 rounded-2xl p-5 relative flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                      <Shirt className="w-4 h-4 text-emerald-600" />
                      기후 맞춤형 의류 코디 추천
                    </h3>

                    {isLoadingCommentary ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                            <Shirt className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-[10px] font-mono text-slate-400">RECOMMENDED FASHION</div>
                            <p className="text-xs font-semibold text-slate-800 mt-0.5">
                              {aiCommentary?.clothingRecommendation ? aiCommentary.clothingRecommendation.split('.')[0] + '.' : "기온에 맞는 가벼운 통풍성 복장을 추천합니다."}
                            </p>
                          </div>
                        </div>

                        {/* Fashion Checklist bullet list depending on weather conditions */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">오늘 외출 필수 아이템</div>
                          
                          {selectedRegion.rain > 0 ? (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                              <span><strong>장화(Rainboots)</strong> 및 튼튼한 장우산 필수</span>
                            </div>
                          ) : selectedRegion.temp >= 30 ? (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>자외선 차단 선크림 &amp; 선글라스</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>일교차 대비 얇은 레이어 가디건</span>
                            </div>
                          )}

                          {selectedRegion.wind >= 4 ? (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                              <span>강풍을 막아줄 얇은 바람막이 자켓</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                              <span>시원한 린넨 셔츠나 얇은 슬랙스</span>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800/50 mt-4 pt-3 flex justify-between items-center">
                    <span>Fashion Intel Engine v1.2</span>
                    <ThumbsUp className="w-3 h-3 text-slate-500 hover:text-emerald-400 cursor-pointer" />
                  </div>
                </div>

                {/* 3. Discomfort & Comfort index Gauge Card */}
                <div id="comfort_index_card" className="bg-white border border-slate-200 rounded-2xl p-5 relative flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-rose-500" />
                      기후 불쾌지수 분석 피드백
                    </h3>

                    <div className="flex items-center gap-5 mt-2">
                      {/* Interactive dynamic Circular Gauge */}
                      <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(15,23,42,0.04)" strokeWidth="3" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            className={`${diInfo.fill} transition-all duration-1000 ease-in-out`}
                            strokeWidth="3.2"
                            strokeDasharray={`${diInfo.value}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-mono font-bold text-slate-800 leading-none">{diInfo.value}</span>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">DI Value</span>
                        </div>
                      </div>

                      {/* Level and brief feedback text */}
                      <div>
                        <div className="text-[10px] font-mono text-slate-400">DISCOMFORT LEVEL</div>
                        <div className={`text-base font-bold flex items-center gap-1.5 mt-0.5`}>
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${diInfo.color}`}>
                            {diInfo.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                          {diInfo.desc}
                        </p>
                      </div>
                    </div>

                    {/* Environment status bars */}
                    <div className="space-y-2 mt-4">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>빨래 건조 지수</span>
                          <span className="font-mono text-emerald-600 font-semibold">{selectedRegion.humidity > 75 ? "실외 불가 (제습기 추천)" : "적합"}</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.max(10, 100 - selectedRegion.humidity)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>야외 환기 적합도</span>
                          <span className="font-mono text-sky-600 font-semibold">{selectedRegion.rain > 0 ? "불가 (비 들이침)" : "적합"}</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500" style={{ width: `${selectedRegion.rain > 0 ? 10 : 85}%` }} />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] text-slate-400 font-mono border-t border-slate-100 mt-4 pt-3 text-right">
                    KMA Discomfort Formula Applied
                  </div>
                </div>

                {/* 4. Large Bento Box: 실시간 초단기 강수예측 시뮬레이터 */}
                <div id="local_precipitation_forecast_card" className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 relative flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <CloudRain className="w-4 h-4 text-sky-600 animate-bounce" />
                        지역 맞춤형 초단기 강수예측 시뮬레이터 (6시간)
                      </h3>
                      <span className="text-[10px] text-sky-700 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {selectedRegion.name} ({selectedRegion.englishName})
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      선택된 <strong>{selectedRegion.name}</strong> 지역의 향후 6시간 동안의 초단기 강수 변화 추이를 보여줍니다. 
                      아래 시뮬레이션 슬라이더 또는 즉시 설정 버튼을 클릭해 기상 상황에 따른 예측 모델 변화를 테스트해 보세요.
                    </p>

                    {/* Interactive Slider & Quick Presets */}
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        
                        {/* Preset Buttons */}
                        <div className="w-full sm:w-auto">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">강수 강도 단축 설정</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePrecipitationChange(0)}
                              className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer ${
                                selectedRegion.rain === 0
                                  ? "bg-slate-200 text-slate-800 border-slate-300 font-bold shadow-sm"
                                  : "bg-slate-100 text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-200/50"
                              }`}
                            >
                              ☀️ 맑음 (0mm)
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrecipitationChange(2.5)}
                              className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer ${
                                selectedRegion.rain === 2.5
                                  ? "bg-sky-100 text-sky-700 border-sky-300 font-bold shadow-sm"
                                  : "bg-slate-100 text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-200/50"
                              }`}
                            >
                              🌦️ 약한 비 (2.5mm)
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrecipitationChange(8.0)}
                              className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer ${
                                selectedRegion.rain === 8.0
                                  ? "bg-blue-100 text-blue-700 border-blue-300 font-bold shadow-sm"
                                  : "bg-slate-100 text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-200/50"
                              }`}
                            >
                              🌧️ 보통 비 (8.0mm)
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrecipitationChange(22.5)}
                              className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer ${
                                selectedRegion.rain === 22.5
                                  ? "bg-rose-100 text-rose-700 border-rose-300 font-bold shadow-sm"
                                  : "bg-slate-100 text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-200/50"
                              }`}
                            >
                              ⚡ 호우경보 (22.5mm)
                            </button>
                          </div>
                        </div>

                        {/* Slide Adjuster */}
                        <div className="w-full sm:flex-1 max-w-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">미세 강수량 조절</span>
                            <span className="text-xs font-mono font-bold text-sky-600">{selectedRegion.rain.toFixed(1)} mm/h</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="0.5"
                            value={selectedRegion.rain}
                            onChange={(e) => handlePrecipitationChange(parseFloat(e.target.value))}
                            className="w-full accent-sky-500 bg-slate-200 cursor-pointer h-1.5 rounded-lg appearance-none border-0"
                          />
                        </div>

                      </div>
                    </div>

                    {/* Horizontal Forecast Timeline Bars */}
                    <div className="grid grid-cols-6 gap-2 pt-2">
                      {selectedRegion.radarForecast.map((rainVal, stepIdx) => {
                        const stepLabels = ["현재", "+1시간", "+2시간", "+3시간", "+4시간", "+6시간"];
                        const maxVal = 30;
                        const percentHeight = Math.min(100, Math.max(10, (rainVal / maxVal) * 100));
                        
                        // Decide color/badge based on rain level
                        let barBg = "bg-slate-200 hover:bg-slate-300";
                        let textClass = "text-slate-500";
                        let statusText = "맑음";
                        if (rainVal > 0 && rainVal <= 3) {
                          barBg = "bg-gradient-to-t from-sky-500 to-sky-300 shadow-[0_2px_8px_rgba(56,189,248,0.15)]";
                          textClass = "text-sky-600 font-bold";
                          statusText = "약한비";
                        } else if (rainVal > 3 && rainVal <= 10) {
                          barBg = "bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_2px_10px_rgba(96,165,250,0.2)]";
                          textClass = "text-blue-600 font-bold";
                          statusText = "보통비";
                        } else if (rainVal > 10) {
                          barBg = "bg-gradient-to-t from-rose-500 to-amber-500 shadow-[0_2px_12px_rgba(239,68,68,0.25)]";
                          textClass = "text-rose-500 font-bold";
                          statusText = "폭우";
                        }

                        return (
                          <div key={`forecast-bento-step-${stepIdx}`} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col items-center justify-between text-center min-h-[160px] relative group hover:border-slate-200 transition-all shadow-sm">
                            {/* Time */}
                            <span className="text-[10px] font-mono text-slate-400">{stepLabels[stepIdx]}</span>
                            
                            {/* Bar container */}
                            <div className="w-3.5 h-20 bg-slate-900/60 rounded-full flex items-end overflow-hidden my-2 border border-slate-900">
                              <motion.div 
                                className={`w-full rounded-b-full transition-all duration-300 ${barBg}`}
                                style={{ height: `${percentHeight}%` }}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                originY={1}
                              />
                            </div>

                            {/* Value */}
                            <div className="flex flex-col items-center">
                              <span className={`text-[10px] font-mono ${textClass}`}>{rainVal.toFixed(1)}</span>
                              <span className="text-[8px] text-slate-500 mt-0.5">{statusText}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800/50 mt-5 pt-3 flex justify-between items-center">
                    <span>수치예보 시뮬레이션 기반</span>
                    <span className="text-sky-500 font-semibold">초단기 예측 모델 적용됨</span>
                  </div>
                </div>

                {/* 5. Large Bento Box: 오늘 가기 좋은 장소 추천 (야외/실내) */}
                <div id="place_recommendation_card" className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 relative shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-600" />
                    오늘 날씨에 어울리는 장소 추천
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3.5">
                    비·강풍·폭염·한파일 땐 실내를, 쾌적한 날엔 야외를 우선 추천해요.
                  </p>

                  {isLoadingCommentary ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(
                        [
                          {
                            type: "outdoor" as const,
                            label: "야외 활동",
                            icon: Trees,
                            places:
                              aiCommentary?.activityRecommendation?.outdoorPlaces ??
                              ["동네 공원 산책로", "한강공원 피크닉", "루프탑 카페", "근교 등산로"],
                            recommendedCard: "rounded-xl border p-3.5 border-emerald-300 bg-emerald-50/60",
                            recommendedIcon: "w-4 h-4 text-emerald-600",
                            recommendedBadge: "text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white",
                            recommendedDot: "w-1 h-1 rounded-full bg-emerald-500",
                          },
                          {
                            type: "indoor" as const,
                            label: "실내 활동",
                            icon: Home,
                            places:
                              aiCommentary?.activityRecommendation?.indoorPlaces ??
                              ["대형 서점·북카페", "실내 클라이밍짐", "영화관", "미술관·전시회"],
                            recommendedCard: "rounded-xl border p-3.5 border-indigo-300 bg-indigo-50/60",
                            recommendedIcon: "w-4 h-4 text-indigo-600",
                            recommendedBadge: "text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white",
                            recommendedDot: "w-1 h-1 rounded-full bg-indigo-500",
                          },
                        ] as const
                      ).map((group) => {
                        const isRecommended =
                          (aiCommentary?.activityRecommendation?.recommended ?? "outdoor") === group.type;
                        const Icon = group.icon;
                        return (
                          <div
                            key={group.type}
                            className={isRecommended ? group.recommendedCard : "rounded-xl border p-3.5 border-slate-100 bg-slate-50"}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <Icon className={isRecommended ? group.recommendedIcon : "w-4 h-4 text-slate-400"} />
                                {group.label}
                              </div>
                              {isRecommended && <span className={group.recommendedBadge}>오늘 추천</span>}
                            </div>
                            <ul className="space-y-1.5">
                              {group.places.map((place, i) => (
                                <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <span className={isRecommended ? group.recommendedDot : "w-1 h-1 rounded-full bg-slate-300"} />
                                  {place}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </section>

          </div>
        )}

        {/* TAB 2: Climate Change Trends & Scenarios */}
        {activeTab === "climate" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* CARD 1: Historical Climate Trend Chart (Custom animated SVG) */}
            <div id="historical_trends_card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                    과거 35년간 한반도 평균 기온 변화 트렌드 (1990 ~ 2025)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">한반도의 온난화 속도는 전 세계 평균보다 가파르게 상승하고 있습니다.</p>
                </div>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-mono rounded font-bold">위기 위험</span>
              </div>

              {/* High Quality Custom SVG Line Chart */}
              <div className="relative h-[280px] w-full bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between">
                
                <div className="flex-1 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="area-temp-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(239, 68, 68, 0.2)" />
                        <stop offset="100%" stopColor="rgba(239, 68, 68, 0.0)" />
                      </linearGradient>
                    </defs>

                    {/* Y Gridlines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(15,23,42,0.06)" strokeWidth="0.1" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(15,23,42,0.06)" strokeWidth="0.1" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(15,23,42,0.06)" strokeWidth="0.1" />

                    {/* Area fill for Temperature trend */}
                    <path
                      d={`M 0 50
                          L 0 ${50 - (historicalClimateData[0].avgTemp - 11) * 12}
                          L 14.2 ${50 - (historicalClimateData[1].avgTemp - 11) * 12}
                          L 28.5 ${50 - (historicalClimateData[2].avgTemp - 11) * 12}
                          L 42.8 ${50 - (historicalClimateData[3].avgTemp - 11) * 12}
                          L 57.1 ${50 - (historicalClimateData[4].avgTemp - 11) * 12}
                          L 71.4 ${50 - (historicalClimateData[5].avgTemp - 11) * 12}
                          L 85.7 ${50 - (historicalClimateData[6].avgTemp - 11) * 12}
                          L 100 ${50 - (historicalClimateData[7].avgTemp - 11) * 12}
                          L 100 50 Z`}
                      fill="url(#area-temp-grad)"
                    />

                    {/* Heatwave bars inside chart (secondary axis) */}
                    {historicalClimateData.map((d, idx) => {
                      const x = (idx / 7) * 100;
                      // Height based on heatwave days (max is around 25)
                      const barHeight = (d.heatwaveDays / 25) * 35;
                      return (
                        <rect
                          key={`hw-bar-${idx}`}
                          x={x - 1.5}
                          y={50 - barHeight}
                          width="3"
                          height={barHeight}
                          fill="rgba(245, 158, 11, 0.35)"
                          rx="0.5"
                          className="transition-all hover:fill-amber-500 cursor-pointer"
                        />
                      );
                    })}

                    {/* Line for Temperature trend */}
                    <path
                      d={`M 0 ${50 - (historicalClimateData[0].avgTemp - 11) * 12}
                          L 14.2 ${50 - (historicalClimateData[1].avgTemp - 11) * 12}
                          L 28.5 ${50 - (historicalClimateData[2].avgTemp - 11) * 12}
                          L 42.8 ${50 - (historicalClimateData[3].avgTemp - 11) * 12}
                          L 57.1 ${50 - (historicalClimateData[4].avgTemp - 11) * 12}
                          L 71.4 ${50 - (historicalClimateData[5].avgTemp - 11) * 12}
                          L 85.7 ${50 - (historicalClimateData[6].avgTemp - 11) * 12}
                          L 100 ${50 - (historicalClimateData[7].avgTemp - 11) * 12}`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                    />

                    {/* Line dots and interactive trigger zones */}
                    {historicalClimateData.map((d, idx) => {
                      const x = (idx / 7) * 100;
                      const y = 50 - (d.avgTemp - 11) * 12;
                      return (
                        <g key={`dot-group-${idx}`} className="cursor-pointer">
                          <circle
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill="#ef4444"
                            stroke="#ffffff"
                            strokeWidth="0.5"
                            onMouseEnter={() => setHistoryTooltipIndex(idx)}
                            onMouseLeave={() => setHistoryTooltipIndex(null)}
                          />
                          {/* Larger invisible hover rect to make tapping easy */}
                          <rect
                            x={x - 5}
                            y="0"
                            width="10"
                            height="50"
                            fill="transparent"
                            onMouseEnter={() => setHistoryTooltipIndex(idx)}
                            onMouseLeave={() => setHistoryTooltipIndex(null)}
                          />
                        </g>
                      );
                    })}

                  </svg>

                  {/* HTML tooltip overlay */}
                  {historyTooltipIndex !== null && (
                    <div
                      className="absolute bg-white/95 border border-slate-200 p-2.5 rounded-lg shadow-md text-xs z-10 w-44 pointer-events-none"
                      style={{
                        left: `${Math.min(65, (historyTooltipIndex / 7) * 100)}%`,
                        top: "10%",
                      }}
                    >
                      <div className="font-bold text-slate-800 mb-1 font-mono">
                        {historicalClimateData[historyTooltipIndex].year}년 통계
                      </div>
                      <div className="flex justify-between mb-0.5 text-slate-500">
                        <span>평균 기온:</span>
                        <span className="font-mono text-rose-600 font-bold">
                          {historicalClimateData[historyTooltipIndex].avgTemp}°C
                        </span>
                      </div>
                      <div className="flex justify-between mb-0.5 text-slate-500">
                        <span>폭염일수:</span>
                        <span className="font-mono text-amber-600">
                          {historicalClimateData[historyTooltipIndex].heatwaveDays}일
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>열대야일수:</span>
                        <span className="font-mono text-indigo-600">
                          {historicalClimateData[historyTooltipIndex].tropicalNights}일
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* X axis labels */}
                <div className="flex justify-between text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-1">
                  {historicalClimateData.map((d) => (
                    <span key={`lbl-yr-${d.year}`}>{d.year}</span>
                  ))}
                </div>

              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs justify-center font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 block"></span>
                  <span>연간 평균 기온 (°C, 좌축)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded bg-amber-500/40 block"></span>
                  <span>폭염일수 (33°C 이상 일수, 우축)</span>
                </div>
              </div>

              {/* Climate Alert Note */}
              <div className="mt-4 bg-rose-50/50 border border-rose-100 p-3 rounded-xl flex items-start gap-2.5 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-rose-600">기상 이변 빈도 급증:</strong> 지난 30년간 한국의 여름 폭염일수는 무려 <strong>290% 증가</strong>했으며, 남부지방의 열대야 발생 빈도가 강원 내륙 지방까지 지속적으로 확대 확장되고 있습니다.
                </div>
              </div>

            </div>

            {/* CARD 2: Future Climate Projections RCP Scenario Chart */}
            <div id="future_scenarios_card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    미래 기후 예측 시나리오 (RCP 4.5 vs RCP 8.5)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">2050년까지 온실가스 감축 여부에 따른 두 가지 기후 모델링 분석입니다.</p>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-mono rounded text-slate-500 font-bold border border-slate-200">KMA 모델</span>
              </div>

              {/* High Quality Custom SVG Line Chart */}
              <div className="relative h-[280px] w-full bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between">
                
                <div className="flex-1 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    
                    {/* Y Gridlines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(15,23,42,0.06)" strokeWidth="0.1" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(15,23,42,0.06)" strokeWidth="0.1" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(15,23,42,0.06)" strokeWidth="0.1" />

                    {/* Line for RCP 4.5 (Moderate reduction, sky blue / green) */}
                    <path
                      d={`M 0 ${50 - (rcpScenariosData[0].rcp45Temp - 13) * 11}
                          L 20 ${50 - (rcpScenariosData[1].rcp45Temp - 13) * 11}
                          L 40 ${50 - (rcpScenariosData[2].rcp45Temp - 13) * 11}
                          L 60 ${50 - (rcpScenariosData[3].rcp45Temp - 13) * 11}
                          L 80 ${50 - (rcpScenariosData[4].rcp45Temp - 13) * 11}
                          L 100 ${50 - (rcpScenariosData[5].rcp45Temp - 13) * 11}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="1,1"
                    />

                    {/* Line for RCP 8.5 (Business-as-usual high emissions, violent red) */}
                    <path
                      d={`M 0 ${50 - (rcpScenariosData[0].rcp85Temp - 13) * 11}
                          L 20 ${50 - (rcpScenariosData[1].rcp85Temp - 13) * 11}
                          L 40 ${50 - (rcpScenariosData[2].rcp85Temp - 13) * 11}
                          L 60 ${50 - (rcpScenariosData[3].rcp85Temp - 13) * 11}
                          L 80 ${50 - (rcpScenariosData[4].rcp85Temp - 13) * 11}
                          L 100 ${50 - (rcpScenariosData[5].rcp85Temp - 13) * 11}`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                    />

                    {/* Points for RCP 4.5 */}
                    {rcpScenariosData.map((d, idx) => {
                      const x = (idx / 5) * 100;
                      const y = 50 - (d.rcp45Temp - 13) * 11;
                      return (
                        <circle
                          key={`pt-45-${idx}`}
                          cx={x}
                          cy={y}
                          r="1.2"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="0.4"
                          className="cursor-pointer"
                        />
                      );
                    })}

                    {/* Points & Hover Triggers for RCP 8.5 */}
                    {rcpScenariosData.map((d, idx) => {
                      const x = (idx / 5) * 100;
                      const y = 50 - (d.rcp85Temp - 13) * 11;
                      return (
                        <g key={`pt-group-85-${idx}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill="#ef4444"
                            stroke="#ffffff"
                            strokeWidth="0.5"
                            className="cursor-pointer"
                          />
                          <rect
                            x={x - 5}
                            y="0"
                            width="10"
                            height="50"
                            fill="transparent"
                            onMouseEnter={() => setRcpTooltipIndex(idx)}
                            onMouseLeave={() => setRcpTooltipIndex(null)}
                          />
                        </g>
                      );
                    })}

                  </svg>

                  {/* HTML tooltip overlay */}
                  {rcpTooltipIndex !== null && (
                    <div
                      className="absolute bg-white/95 border border-slate-200 p-2.5 rounded-lg shadow-md text-xs z-10 w-44 pointer-events-none"
                      style={{
                        left: `${Math.min(65, (rcpTooltipIndex / 5) * 100)}%`,
                        top: "10%",
                      }}
                    >
                      <div className="font-bold text-slate-800 mb-1 font-mono">
                        {rcpScenariosData[rcpTooltipIndex].year}년 예측치
                      </div>
                      <div className="flex justify-between mb-0.5 text-emerald-600 font-semibold">
                        <span>RCP 4.5 기온:</span>
                        <span className="font-mono">
                          {rcpScenariosData[rcpTooltipIndex].rcp45Temp}°C
                        </span>
                      </div>
                      <div className="flex justify-between mb-0.5 text-rose-600 font-semibold">
                        <span>RCP 8.5 기온:</span>
                        <span className="font-mono">
                          {rcpScenariosData[rcpTooltipIndex].rcp85Temp}°C
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 mt-1 pt-1 border-t border-slate-100">
                        <span>RCP 8.5 폭염일수:</span>
                        <span className="font-mono text-amber-600 font-semibold">
                          {rcpScenariosData[rcpTooltipIndex].rcp85Days}일
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* X axis labels */}
                <div className="flex justify-between text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-1">
                  {rcpScenariosData.map((d) => (
                    <span key={`lbl-fut-yr-${d.year}`}>{d.year}</span>
                  ))}
                </div>

              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs justify-center font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-500 block border-dashed border-t"></span>
                  <span>RCP 4.5 (자율 감축 시나리오)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 block"></span>
                  <span>RCP 8.5 (고탄소배출/방치 시나리오)</span>
                </div>
              </div>

              {/* Climate Alert Note */}
              <div className="mt-4 bg-sky-50/50 border border-sky-100 p-3 rounded-xl flex items-start gap-2.5 shadow-sm">
                <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-sky-600">시나리오 해석:</strong> 현 탄소 배출 추이가 유지되면(RCP 8.5), 2050년 한반도 폭염일수는 무려 <strong>연간 52일</strong>에 달해 연중 두 달 가량이 정상적인 실외 활동이 불가능한 극한 기후로 변모할 우려가 큽니다.
                </div>
              </div>

            </div>

          </div>
        )}

      </MobileFrameWrapper>

      {/* 4. Persistent Chatbot Bubble & Drawer overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            id="chat_sidebar_drawer"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">클라이밋 버디 (Climate Buddy)</h3>
                  <p className="text-[10px] text-slate-500">Gemini 3.5 기반 기후/날씨 전문 지식 비서</p>
                </div>
              </div>
              <button
                id="close_chat_btn"
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chatbot Messages List Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
              {chatMessages.map((msg, idx) => (
                <div
                  key={`msg-${idx}`}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap border ${
                      msg.role === "user"
                        ? "bg-sky-600 text-white font-medium border-transparent rounded-tr-none shadow-sm"
                        : "bg-white text-slate-800 border-slate-200 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTypingChat && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-400 border border-slate-200 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Shortcuts Grid */}
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-1.5">추천 빠른 질문</div>
              <div className="grid grid-cols-2 gap-1.5">
                {chatShortcuts.map((cut, idx) => (
                  <button
                    key={`cut-${idx}`}
                    onClick={() => triggerShortcut(cut.prompt)}
                    className="p-2 text-[10px] text-left text-slate-600 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg truncate transition-colors leading-tight cursor-pointer shadow-sm"
                  >
                    {cut.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-2">
                <input
                  id="chat_input_field"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="예: 서울 비 많이 오는데 패션 스타일 어때?"
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 px-3 py-2 rounded-xl focus:outline-none focus:bg-white focus:border-sky-500 transition-colors"
                />
                <button
                  id="send_chat_btn"
                  type="submit"
                  disabled={!chatInput.trim() || isTypingChat}
                  className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition-colors shrink-0 cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Trigger Button in Bottom Right when closed */}
      {!isChatOpen && (
        <button
          id="floating_chat_trigger"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-2xl border border-transparent z-40 transition-transform hover:scale-105 cursor-pointer"
          title="AI 기후 비서와 대화하기"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

    </div>
  );
}
