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
  Monitor
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
      <div className="relative w-[385px] h-[820px] rounded-[52px] border-[12px] border-slate-900 bg-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden flex flex-col ring-1 ring-white/10">
        
        {/* Notch / Speaker Bar */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-b-xl z-50 flex items-center justify-center border-b border-x border-slate-900/60">
          <div className="w-10 h-1 bg-slate-900 rounded-full" />
        </div>
        
        {/* Mock iPhone Status Bar */}
        <div className="h-9 px-6 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-400 bg-slate-950/90 z-40 select-none shrink-0 border-b border-slate-900/40">
          <span className="font-semibold text-slate-300">09:41</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-end gap-[1px]">
              <span className="w-[1.2px] h-[3px] bg-slate-400 rounded-sm"></span>
              <span className="w-[1.2px] h-[5px] bg-slate-400 rounded-sm"></span>
              <span className="w-[1.2px] h-[7px] bg-slate-400 rounded-sm"></span>
              <span className="w-[1.2px] h-[9px] bg-slate-400 rounded-sm"></span>
            </span>
            <span className="text-[9px] text-slate-300">5G</span>
            <span className="w-4 h-2.5 border border-slate-500 rounded p-[0.5px] flex items-center">
              <span className="h-full w-2.5 bg-emerald-400 rounded-sm"></span>
            </span>
          </div>
        </div>

        {/* Device Viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-950 scrollbar-none pb-12 pt-1.5">
          <div className="px-3.5 space-y-4">
            {children}
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full z-50 pointer-events-none" />
      </div>
    </div>
  );
};

export default function App() {
  // Region & Radar States
  const [selectedRegion, setSelectedRegion] = useState<WeatherData>(regionsData[0]);
  const [radarOn, setRadarOn] = useState<boolean>(true);
  const [forecastStep, setForecastStep] = useState<number>(0);
  const [isPlayingRadar, setIsPlayingRadar] = useState<boolean>(true);

  // Custom Searched Regions & Search Inputs
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [customRegions, setCustomRegions] = useState<WeatherData[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  // AI Commentary States
  const [aiCommentary, setAiCommentary] = useState<{
    commentary: string;
    clothingRecommendation: string;
    lifestyleTip: string;
    sensoryFeel: string;
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
      const data = await response.json();
      setAiCommentary(data);
    } catch (error) {
      console.error("Error fetching commentary:", error);
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
      const localMatch = regionsData.find(
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
        setSearchError("검색한 지역의 정보를 찾지 못했습니다.");
      }
    } catch (error: any) {
      console.error("Search error:", error);
      setSearchError("위치를 검색하는 동안 오류가 발생했습니다. 정확한 지명이나 도로명을 입력해 보세요.");
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
            region: selectedRegion.name,
            temp: selectedRegion.temp,
            humidity: selectedRegion.humidity,
            wind: selectedRegion.wind,
            rain: selectedRegion.rain,
            condition: translateCondition(selectedRegion.condition)
          }
        })
      });

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (error) {
      console.error("Error sending chat message:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "서버와의 대화 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요!" }
      ]);
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

  // Helper: Get color for radar precipitation level
  const getPrecipitationColor = (rain: number) => {
    if (rain === 0) return "rgba(255,255,255,0.05)";
    if (rain < 3.0) return "rgba(14, 165, 233, 0.45)"; // Light sky blue
    if (rain < 10.0) return "rgba(16, 185, 129, 0.6)"; // Moderate emerald green
    if (rain < 20.0) return "rgba(245, 158, 11, 0.75)"; // Heavy amber orange
    return "rgba(239, 68, 68, 0.85)"; // Severe red
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
    <div id="app_root" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-sky-200 overflow-x-hidden pb-12">
      
      {/* 1. Atmospheric Grid Glow Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* 2. Top Sleek Command Header */}
      <header id="header_section" className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 neon-glow-rain animate-pulse">
              <Activity className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-widest text-sky-500 font-semibold uppercase">National Climate Intel</span>
                <span className="px-1.5 py-0.5 bg-slate-900 text-[10px] font-mono rounded text-slate-400 border border-slate-800">V2.5 Live</span>
              </div>
              <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
                기후 예측 및 AI 브리핑 <span className="text-sm font-normal text-slate-400">| Radar & Assistant</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Main Tabs switcher */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                id="tab_weather_btn"
                onClick={() => setActiveTab("weather")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === "weather"
                    ? "bg-sky-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/15"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                초단기 예측 & 스타일링
              </button>
              <button
                id="tab_climate_btn"
                onClick={() => setActiveTab("climate")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === "climate"
                    ? "bg-sky-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/15"
                    : "text-slate-400 hover:text-white"
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
              className="relative p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all flex items-center gap-2 text-xs"
            >
              <MessageSquare className="w-4 h-4 text-sky-400 animate-bounce" />
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
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300 hover:text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
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
            <section id="radar_map_section" className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 relative backdrop-blur-sm overflow-hidden flex flex-col h-[650px]">
              
              <div className="flex items-center justify-between mb-4 z-10">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-400" />
                    초단기 강수예측 레이더
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">남한 전역 실시간 및 6시간 강수 시뮬레이션</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">Radar FX Overlay</span>
                  <button
                    id="toggle_radar_btn"
                    onClick={() => setRadarOn(!radarOn)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      radarOn ? "bg-sky-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
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
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      placeholder="지역명, 동, 구 또는 상세 주소 검색..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-1.5 pl-8.5 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:cursor-not-allowed"
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
                  <p className="text-[10px] text-rose-400 mt-1 pl-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {searchError}
                  </p>
                )}
              </div>

              {/* High Tech Interactive Map View Area */}
              <div className="relative flex-1 bg-slate-950/40 rounded-xl border border-slate-800/40 overflow-hidden flex items-center justify-center">
                
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
                    
                    {/* Background Grid Coordinates */}
                    <g opacity="0.15">
                      <line x1="10" y1="0" x2="10" y2="110" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="30" y1="0" x2="30" y2="110" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="50" y1="0" x2="50" y2="110" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="70" y1="0" x2="70" y2="110" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="90" y1="0" x2="90" y2="110" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                      
                      <line x1="0" y1="20" x2="100" y2="20" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="0" y1="40" x2="100" y2="40" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="0" y1="60" x2="100" y2="60" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="0" y1="80" x2="100" y2="80" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                      <line x1="0" y1="100" x2="100" y2="100" stroke="white" strokeWidth="0.2" strokeDasharray="1,2" />
                    </g>

                    {/* Highly stylized simplified map contour connecting major regions */}
                    <path
                      d="M 33 15 L 43 14 L 62 13 L 64 22 L 60 28 L 68 40 L 73 52 L 75 58 L 71 67 L 66 73 L 53 73 L 42 75 L 30 76 L 20 73 L 18 64 L 28 54 L 20 44 L 22 34 L 18 24 L 28 20 Z"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />

                    {/* Simulated RADAR CLOUD HEATMAP cell rings (toggled under radarOn) */}
                    {radarOn && (
                      <g>
                        {regionsData.map((reg) => {
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
                    {regionsData.map((reg) => {
                      const isSelected = selectedRegion.id === reg.id;
                      const hasRain = reg.rain > 0;
                      
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
                              stroke="#0ea5e9"
                              strokeWidth="0.75"
                              className="animate-pulse"
                            />
                          )}

                          {/* Pin dot */}
                          <circle
                            cx={reg.x}
                            cy={reg.y}
                            r={isSelected ? "2.5" : "1.8"}
                            fill={isSelected ? "#38bdf8" : hasRain ? "#0284c7" : "#475569"}
                            stroke="rgba(15, 23, 42, 0.9)"
                            strokeWidth="0.5"
                            className="transition-all duration-300 group-hover:scale-125 group-hover:fill-sky-400"
                          />

                          {/* Hover text / dynamic text tags next to nodes */}
                          <text
                            x={reg.x + (reg.x > 60 ? -3 : 3)}
                            y={reg.y + 1}
                            textAnchor={reg.x > 60 ? "end" : "start"}
                            fill={isSelected ? "#f8fafc" : "#94a3b8"}
                            fontSize="3"
                            fontFamily="sans-serif"
                            fontWeight={isSelected ? "bold" : "normal"}
                            className="pointer-events-none select-none transition-all duration-300"
                          >
                            {reg.name}
                            {isSelected && ` (${reg.temp}°)`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Custom Searched Pins */}
                    {customRegions.map((reg) => {
                      const isSelected = selectedRegion.id === reg.id;
                      const hasRain = reg.rain > 0;
                      
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
                              stroke="#c084fc"
                              strokeWidth="0.75"
                              className="animate-pulse"
                            />
                          )}

                          {/* Pin dot */}
                          <circle
                            cx={reg.x}
                            cy={reg.y}
                            r={isSelected ? "2.5" : "1.8"}
                            fill={isSelected ? "#e9d5ff" : hasRain ? "#c084fc" : "#a855f7"}
                            stroke="rgba(15, 23, 42, 0.9)"
                            strokeWidth="0.5"
                            className="transition-all duration-300 group-hover:scale-125 group-hover:fill-purple-300"
                          />

                          {/* Hover text next to nodes */}
                          <text
                            x={reg.x + (reg.x > 60 ? -3 : 3)}
                            y={reg.y + 1}
                            textAnchor={reg.x > 60 ? "end" : "start"}
                            fill={isSelected ? "#f3e8ff" : "#d8b4fe"}
                            fontSize="3"
                            fontFamily="sans-serif"
                            fontWeight={isSelected ? "bold" : "normal"}
                            className="pointer-events-none select-none transition-all duration-300"
                          >
                            📍 {reg.name}
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
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 p-2 rounded-lg backdrop-blur-sm z-10">
                    <div className="text-[9px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Precip Intensity (강수강도)</div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[8px] font-mono">
                          <span className="w-2.5 h-1.5 rounded bg-rose-500 block"></span>
                          <span>&gt; 20 mm/h (폭우)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] font-mono">
                          <span className="w-2.5 h-1.5 rounded bg-amber-500 block"></span>
                          <span>10 - 20 mm/h (강한비)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] font-mono">
                          <span className="w-2.5 h-1.5 rounded bg-emerald-500 block"></span>
                          <span>3 - 10 mm/h (보통비)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] font-mono">
                          <span className="w-2.5 h-1.5 rounded bg-sky-500 block"></span>
                          <span>0.1 - 3 mm/h (약한비)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Right: Selection indicator */}
                <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-sky-500/30 px-3 py-1.5 rounded-lg z-10 flex items-center gap-2 max-w-[240px]">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[8px] font-mono text-slate-400">SELECTED REGION</div>
                    <div className="text-xs font-bold text-white leading-none truncate">{selectedRegion.name} ({selectedRegion.englishName})</div>
                    {selectedRegion.fullAddress && (
                      <div className="text-[9px] text-slate-400 truncate mt-1" title={selectedRegion.fullAddress}>
                        {selectedRegion.fullAddress}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Slider & Play Controls for Ultra Short Term Radar */}
              <div id="radar_timeline_controls" className="mt-4 bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                
                <div className="flex items-center justify-between gap-4 mb-2">
                  
                  <div className="flex items-center gap-2">
                    <button
                      id="play_pause_radar_btn"
                      onClick={() => setIsPlayingRadar(!isPlayingRadar)}
                      className="p-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors"
                      title={isPlayingRadar ? "자동재생 일시정지" : "레이더 시뮬레이션 재생"}
                    >
                      {isPlayingRadar ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    
                    <button
                      id="reset_radar_step_btn"
                      onClick={() => { setForecastStep(0); setIsPlayingRadar(false); }}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors"
                      title="현재 시각으로 리셋"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Highlight step */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Predictive Step</span>
                    <div className="text-xs font-bold text-sky-400 font-mono">
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
                        className={`flex-1 py-1 text-[10px] font-semibold rounded-md border transition-all duration-300 ${
                          isActive
                            ? "bg-sky-500/20 text-sky-400 border-sky-500/40 font-bold"
                            : "bg-slate-900/40 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900"
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
              <div id="region_weather_header_card" className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800/80 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                    {getWeatherIcon(selectedRegion.condition, "w-10 h-10")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold tracking-tight text-white">{selectedRegion.name}</h2>
                      <span className="text-xs font-mono text-slate-400 font-semibold">{selectedRegion.englishName}</span>
                    </div>
                    {selectedRegion.fullAddress && (
                      <div className="text-[11px] text-sky-400/80 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{selectedRegion.fullAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300 font-medium">
                      <span>체감 기상: </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${diInfo.color}`}>
                        {aiCommentary?.sensoryFeel || translateCondition(selectedRegion.condition)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core parameters metrics bar */}
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">TEMPERATURE</span>
                    <span className="text-2xl font-display font-semibold text-white tracking-tight">{selectedRegion.temp}°C</span>
                  </div>
                  <div className="text-center border-l border-slate-800 pl-4 sm:pl-6">
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">HUMIDITY</span>
                    <span className="text-2xl font-display font-semibold text-sky-400 tracking-tight">{selectedRegion.humidity}%</span>
                  </div>
                  <div className="text-center border-l border-slate-800 pl-4 sm:pl-6">
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">PRECIPITATION</span>
                    <span className="text-2xl font-display font-semibold text-blue-400 tracking-tight">{selectedRegion.rain} mm</span>
                  </div>
                </div>

              </div>

              {/* Bento Grid: AI Content & Index gauges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Large Bento Box: AI climate analyst advice */}
                <div id="ai_commentary_card" className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm min-h-[220px] flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-3">
                    <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-xs font-mono text-sky-500 font-bold uppercase tracking-wider mb-2">AI Climate Analyst Commentary</h3>
                    
                    {isLoadingCommentary ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                        <p className="text-xs text-slate-400 font-mono animate-pulse">Gemini-3.5가 실시간 날씨 데이터 및 불쾌지수를 심층 분석하는 중...</p>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <p className="text-sm md:text-base leading-relaxed text-slate-200">
                          {aiCommentary?.commentary || `${selectedRegion.name} 지역은 현재 기온 ${selectedRegion.temp}°C에 습도 ${selectedRegion.humidity}%로 후텁지근한 상태입니다. 기후 예측 모델에 따라 비구름의 유동성을 예의주시하고 있습니다.`}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {!isLoadingCommentary && aiCommentary?.lifestyleTip && (
                    <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-start gap-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-semibold shrink-0">클라이밋 팁</span>
                      <p className="text-slate-400 italic">{aiCommentary.lifestyleTip}</p>
                    </div>
                  )}

                </div>

                {/* 2. Style & Fashion recommendation Card */}
                <div id="lifestyle_fashion_card" className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative backdrop-blur-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
                      <Shirt className="w-4 h-4 text-emerald-400" />
                      기후 맞춤형 의류 코디 추천
                    </h3>

                    {isLoadingCommentary ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                            <Shirt className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-[10px] font-mono text-slate-500">RECOMMENDED FASHION</div>
                            <p className="text-xs font-semibold text-white mt-0.5">
                              {aiCommentary?.clothingRecommendation ? aiCommentary.clothingRecommendation.split('.')[0] + '.' : "기온에 맞는 가벼운 통풍성 복장을 추천합니다."}
                            </p>
                          </div>
                        </div>

                        {/* Fashion Checklist bullet list depending on weather conditions */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">오늘 외출 필수 아이템</div>
                          
                          {selectedRegion.rain > 0 ? (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                              <span><strong>장화(Rainboots)</strong> 및 튼튼한 장우산 필수</span>
                            </div>
                          ) : selectedRegion.temp >= 30 ? (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>자외선 차단 선크림 &amp; 선글라스</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                <div id="comfort_index_card" className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative backdrop-blur-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-rose-400" />
                      기후 불쾌지수 분석 피드백
                    </h3>

                    <div className="flex items-center gap-5 mt-2">
                      {/* Interactive dynamic Circular Gauge */}
                      <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
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
                          <span className="text-lg font-mono font-bold text-white leading-none">{diInfo.value}</span>
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">DI Value</span>
                        </div>
                      </div>

                      {/* Level and brief feedback text */}
                      <div>
                        <div className="text-[10px] font-mono text-slate-500">DISCOMFORT LEVEL</div>
                        <div className={`text-base font-bold flex items-center gap-1.5 mt-0.5`}>
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${diInfo.color}`}>
                            {diInfo.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                          {diInfo.desc}
                        </p>
                      </div>
                    </div>

                    {/* Environment status bars */}
                    <div className="space-y-2 mt-4">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>빨래 건조 지수</span>
                          <span className="font-mono text-emerald-400 font-semibold">{selectedRegion.humidity > 75 ? "실외 불가 (제습기 추천)" : "적합"}</span>
                        </div>
                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400" style={{ width: `${Math.max(10, 100 - selectedRegion.humidity)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>야외 환기 적합도</span>
                          <span className="font-mono text-sky-400 font-semibold">{selectedRegion.rain > 0 ? "불가 (비 들이침)" : "적합"}</span>
                        </div>
                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-400" style={{ width: `${selectedRegion.rain > 0 ? 10 : 85}%` }} />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800/50 mt-4 pt-3 text-right">
                    KMA Discomfort Formula Applied
                  </div>
                </div>

                {/* 4. Large Bento Box: 실시간 초단기 강수예측 시뮬레이터 */}
                <div id="local_precipitation_forecast_card" className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative backdrop-blur-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                        <CloudRain className="w-4 h-4 text-sky-400 animate-bounce" />
                        지역 맞춤형 초단기 강수예측 시뮬레이터 (6시간)
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">
                        {selectedRegion.name} ({selectedRegion.englishName})
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      선택된 <strong>{selectedRegion.name}</strong> 지역의 향후 6시간 동안의 초단기 강수 변화 추이를 보여줍니다. 
                      아래 시뮬레이션 슬라이더 또는 즉시 설정 버튼을 클릭해 기상 상황에 따른 예측 모델 변화를 테스트해 보세요.
                    </p>

                    {/* Interactive Slider & Quick Presets */}
                    <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl mb-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        
                        {/* Preset Buttons */}
                        <div className="w-full sm:w-auto">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">강수 강도 단축 설정</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePrecipitationChange(0)}
                              className={`px-2.5 py-1 text-xs rounded border transition-all ${
                                selectedRegion.rain === 0
                                  ? "bg-slate-800 text-white border-slate-600 font-bold"
                                  : "bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-300"
                              }`}
                            >
                              ☀️ 맑음 (0mm)
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrecipitationChange(2.5)}
                              className={`px-2.5 py-1 text-xs rounded border transition-all ${
                                selectedRegion.rain === 2.5
                                  ? "bg-sky-950 text-sky-300 border-sky-600/40 font-bold"
                                  : "bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-300"
                              }`}
                            >
                              🌦️ 약한 비 (2.5mm)
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrecipitationChange(8.0)}
                              className={`px-2.5 py-1 text-xs rounded border transition-all ${
                                selectedRegion.rain === 8.0
                                  ? "bg-blue-950 text-blue-300 border-blue-600/40 font-bold"
                                  : "bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-300"
                              }`}
                            >
                              🌧️ 보통 비 (8.0mm)
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrecipitationChange(22.5)}
                              className={`px-2.5 py-1 text-xs rounded border transition-all ${
                                selectedRegion.rain === 22.5
                                  ? "bg-rose-950/60 text-rose-300 border-rose-600/40 font-bold"
                                  : "bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-300"
                              }`}
                            >
                              ⚡ 호우경보 (22.5mm)
                            </button>
                          </div>
                        </div>

                        {/* Slide Adjuster */}
                        <div className="w-full sm:flex-1 max-w-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">미세 강수량 조절</span>
                            <span className="text-xs font-mono font-bold text-sky-400">{selectedRegion.rain.toFixed(1)} mm/h</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="0.5"
                            value={selectedRegion.rain}
                            onChange={(e) => handlePrecipitationChange(parseFloat(e.target.value))}
                            className="w-full accent-sky-400 bg-slate-900 cursor-pointer h-1.5 rounded-lg appearance-none border border-slate-800"
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
                        let barBg = "bg-slate-800 hover:bg-slate-700";
                        let textClass = "text-slate-400";
                        let statusText = "맑음";
                        if (rainVal > 0 && rainVal <= 3) {
                          barBg = "bg-gradient-to-t from-sky-600 to-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]";
                          textClass = "text-sky-300 font-bold";
                          statusText = "약한비";
                        } else if (rainVal > 3 && rainVal <= 10) {
                          barBg = "bg-gradient-to-t from-blue-700 to-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.3)]";
                          textClass = "text-blue-400 font-bold";
                          statusText = "보통비";
                        } else if (rainVal > 10) {
                          barBg = "bg-gradient-to-t from-rose-700 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
                          textClass = "text-rose-400 font-bold";
                          statusText = "폭우";
                        }

                        return (
                          <div key={`forecast-bento-step-${stepIdx}`} className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-2.5 flex flex-col items-center justify-between text-center min-h-[160px] relative group hover:border-slate-700/60 transition-all">
                            {/* Time */}
                            <span className="text-[10px] font-mono text-slate-500">{stepLabels[stepIdx]}</span>
                            
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

              </div>

            </section>

          </div>
        )}

        {/* TAB 2: Climate Change Trends & Scenarios */}
        {activeTab === "climate" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* CARD 1: Historical Climate Trend Chart (Custom animated SVG) */}
            <div id="historical_trends_card" className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    과거 35년간 한반도 평균 기온 변화 트렌드 (1990 ~ 2025)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">한반도의 온난화 속도는 전 세계 평균보다 가파르게 상승하고 있습니다.</p>
                </div>
                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono rounded">위기 위험</span>
              </div>

              {/* High Quality Custom SVG Line Chart */}
              <div className="relative h-[280px] w-full bg-slate-950/40 rounded-xl border border-slate-800/40 p-4 flex flex-col justify-between">
                
                <div className="flex-1 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="area-temp-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(239, 68, 68, 0.25)" />
                        <stop offset="100%" stopColor="rgba(239, 68, 68, 0.0)" />
                      </linearGradient>
                    </defs>

                    {/* Y Gridlines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />

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
                          fill="rgba(245, 158, 11, 0.4)"
                          rx="0.5"
                          className="transition-all hover:fill-amber-400 cursor-pointer"
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
                      stroke="#f87171"
                      strokeWidth="1.2"
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
                            r="1.2"
                            fill="#f87171"
                            stroke="rgba(15, 23, 42, 0.9)"
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
                      className="absolute bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs z-10 w-44 pointer-events-none"
                      style={{
                        left: `${Math.min(65, (historyTooltipIndex / 7) * 100)}%`,
                        top: "10%",
                      }}
                    >
                      <div className="font-bold text-white mb-1 font-mono">
                        {historicalClimateData[historyTooltipIndex].year}년 통계
                      </div>
                      <div className="flex justify-between mb-0.5 text-slate-400">
                        <span>평균 기온:</span>
                        <span className="font-mono text-rose-400 font-bold">
                          {historicalClimateData[historyTooltipIndex].avgTemp}°C
                        </span>
                      </div>
                      <div className="flex justify-between mb-0.5 text-slate-400">
                        <span>폭염일수:</span>
                        <span className="font-mono text-amber-400">
                          {historicalClimateData[historyTooltipIndex].heatwaveDays}일
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>열대야일수:</span>
                        <span className="font-mono text-indigo-400">
                          {historicalClimateData[historyTooltipIndex].tropicalNights}일
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* X axis labels */}
                <div className="flex justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1">
                  {historicalClimateData.map((d) => (
                    <span key={`lbl-yr-${d.year}`}>{d.year}</span>
                  ))}
                </div>

              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs justify-center font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 block"></span>
                  <span>연간 평균 기온 (°C, 좌축)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded bg-amber-500/50 block"></span>
                  <span>폭염일수 (33°C 이상 일수, 우축)</span>
                </div>
              </div>

              {/* Climate Alert Note */}
              <div className="mt-4 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong>기상 이변 빈도 급증:</strong> 지난 30년간 한국의 여름 폭염일수는 무려 <strong>290% 증가</strong>했으며, 남부지방의 열대야 발생 빈도가 강원 내륙 지방까지 지속적으로 확대 확장되고 있습니다.
                </div>
              </div>

            </div>

            {/* CARD 2: Future Climate Projections RCP Scenario Chart */}
            <div id="future_scenarios_card" className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    미래 기후 예측 시나리오 (RCP 4.5 vs RCP 8.5)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">2050년까지 온실가스 감축 여부에 따른 두 가지 기후 모델링 분석입니다.</p>
                </div>
                <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-mono rounded text-slate-400">KMA 모델</span>
              </div>

              {/* High Quality Custom SVG Line Chart */}
              <div className="relative h-[280px] w-full bg-slate-950/40 rounded-xl border border-slate-800/40 p-4 flex flex-col justify-between">
                
                <div className="flex-1 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    
                    {/* Y Gridlines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />

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
                      strokeWidth="1.2"
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
                          r="1"
                          fill="#10b981"
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
                            r="1.2"
                            fill="#ef4444"
                            stroke="rgba(15, 23, 42, 0.9)"
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
                      className="absolute bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs z-10 w-44 pointer-events-none"
                      style={{
                        left: `${Math.min(65, (rcpTooltipIndex / 5) * 100)}%`,
                        top: "10%",
                      }}
                    >
                      <div className="font-bold text-white mb-1 font-mono">
                        {rcpScenariosData[rcpTooltipIndex].year}년 예측치
                      </div>
                      <div className="flex justify-between mb-0.5 text-emerald-400">
                        <span>RCP 4.5 기온:</span>
                        <span className="font-mono">
                          {rcpScenariosData[rcpTooltipIndex].rcp45Temp}°C
                        </span>
                      </div>
                      <div className="flex justify-between mb-0.5 text-rose-400 font-bold">
                        <span>RCP 8.5 기온:</span>
                        <span className="font-mono">
                          {rcpScenariosData[rcpTooltipIndex].rcp85Temp}°C
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 mt-1 pt-1 border-t border-slate-800">
                        <span>RCP 8.5 폭염일수:</span>
                        <span className="font-mono text-amber-400">
                          {rcpScenariosData[rcpTooltipIndex].rcp85Days}일
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* X axis labels */}
                <div className="flex justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1">
                  {rcpScenariosData.map((d) => (
                    <span key={`lbl-fut-yr-${d.year}`}>{d.year}</span>
                  ))}
                </div>

              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs justify-center font-mono text-slate-400">
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
              <div className="mt-4 bg-sky-500/5 border border-sky-500/10 p-3 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong>시나리오 해석:</strong> 현 탄소 배출 추이가 유지되면(RCP 8.5), 2050년 한반도 폭염일수는 무려 <strong>연간 52일</strong>에 달해 연중 두 달 가량이 정상적인 실외 활동이 불가능한 극한 기후로 변모할 우려가 큽니다.
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
            className="fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-semibold text-white">클라이밋 버디 (Climate Buddy)</h3>
                  <p className="text-[10px] text-slate-400">Gemini 3.5 기반 기후/날씨 전문 지식 비서</p>
                </div>
              </div>
              <button
                id="close_chat_btn"
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chatbot Messages List Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={`msg-${idx}`}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap border ${
                      msg.role === "user"
                        ? "bg-sky-500 text-slate-950 font-medium border-sky-400/20 rounded-tr-none"
                        : "bg-slate-950 text-slate-200 border-slate-800 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTypingChat && (
                <div className="flex justify-start">
                  <div className="bg-slate-950 text-slate-400 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Shortcuts Grid */}
            <div className="px-4 py-2 border-t border-slate-800/50 bg-slate-950/40">
              <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1.5">추천 빠른 질문</div>
              <div className="grid grid-cols-2 gap-1.5">
                {chatShortcuts.map((cut, idx) => (
                  <button
                    key={`cut-${idx}`}
                    onClick={() => triggerShortcut(cut.prompt)}
                    className="p-2 text-[10px] text-left text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg truncate transition-colors leading-tight"
                  >
                    {cut.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-800 bg-slate-950">
              <div className="flex gap-2">
                <input
                  id="chat_input_field"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="예: 서울 비 많이 오는데 패션 스타일 어때?"
                  className="flex-1 bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-sky-500/50"
                />
                <button
                  id="send_chat_btn"
                  type="submit"
                  disabled={!chatInput.trim() || isTypingChat}
                  className="p-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 rounded-xl transition-colors shrink-0"
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
          className="fixed bottom-6 right-6 p-4 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-full shadow-2xl shadow-sky-500/20 border border-sky-400/30 z-40 transition-transform hover:scale-105"
          title="AI 기후 비서와 대화하기"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

    </div>
  );
}
