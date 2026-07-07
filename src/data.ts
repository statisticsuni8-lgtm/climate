export interface WeatherData {
  id: string;
  name: string; // Korean name (e.g., 서울)
  englishName: string;
  fullAddress?: string; // Optional full official address
  x: number; // Percentage X on SVG (0-100)
  y: number; // Percentage Y on SVG (0-100)
  temp: number; // °C
  humidity: number; // %
  wind: number; // m/s
  rain: number; // mm/h
  condition: "sunny" | "cloudy" | "rainy" | "windy" | "thunderstorm";
  radarForecast: number[]; // 6 elements: precipitation for [current, +1h, +2h, +3h, +4h, +6h]
}

export interface ClimateTrend {
  year: number;
  avgTemp: number; // Average temp in Korea
  heatwaveDays: number; // Number of days temp > 33°C
  tropicalNights: number; // Number of nights temp > 25°C
  precipitation: number; // Annual precipitation in mm
}

export interface RCPScenario {
  year: number;
  rcp45Temp: number; // Moderate emission scenario
  rcp85Temp: number; // Business-as-usual high emission scenario
  rcp45Days: number; // Heatwave days
  rcp85Days: number; // Heatwave days
}

export const regionsData: WeatherData[] = [
  {
    id: "seoul",
    name: "서울",
    englishName: "Seoul",
    fullAddress: "서울특별시 중구 세종대로 110 (서울시청)",
    x: 35,
    y: 22,
    temp: 27.5,
    humidity: 82,
    wind: 2.1,
    rain: 8.5,
    condition: "rainy",
    radarForecast: [8.5, 12.0, 15.5, 7.0, 3.2, 0.5],
  },
  {
    id: "incheon",
    name: "인천",
    englishName: "Incheon",
    fullAddress: "인천광역시 중구 제물량로 218 (인천역)",
    x: 26,
    y: 22,
    temp: 26.8,
    humidity: 85,
    wind: 4.8,
    rain: 11.2,
    condition: "rainy",
    radarForecast: [11.2, 8.0, 4.2, 1.5, 0.2, 0.0],
  },
  {
    id: "gyeonggi",
    name: "경기",
    englishName: "Gyeonggi",
    fullAddress: "경기도 수원시 팔달구 효원로 1 (경기도청)",
    x: 42,
    y: 25,
    temp: 27.2,
    humidity: 80,
    wind: 1.8,
    rain: 6.0,
    condition: "rainy",
    radarForecast: [6.0, 10.5, 12.0, 9.5, 5.0, 1.2],
  },
  {
    id: "gangwon",
    name: "강원",
    englishName: "Gangwon",
    fullAddress: "강원특별자치도 춘천시 중앙로 1 (강원도청)",
    x: 58,
    y: 18,
    temp: 24.5,
    humidity: 78,
    wind: 3.5,
    rain: 3.0,
    condition: "cloudy",
    radarForecast: [3.0, 5.2, 9.8, 14.0, 11.5, 6.0],
  },
  {
    id: "chungbuk",
    name: "충북",
    englishName: "Chungbuk",
    fullAddress: "충청북도 청주시 상당구 상당로 82 (충청북도청)",
    x: 46,
    y: 38,
    temp: 28.1,
    humidity: 75,
    wind: 1.5,
    rain: 0.0,
    condition: "cloudy",
    radarForecast: [0.0, 1.5, 4.0, 8.5, 9.0, 4.2],
  },
  {
    id: "chungnam",
    name: "충남",
    englishName: "Chungnam",
    fullAddress: "충청남도 홍성군 홍북읍 충남대로 21 (충청남도청)",
    x: 30,
    y: 42,
    temp: 28.5,
    humidity: 78,
    wind: 2.2,
    rain: 1.2,
    condition: "cloudy",
    radarForecast: [1.2, 3.5, 6.8, 4.0, 1.2, 0.0],
  },
  {
    id: "daejeon",
    name: "대전",
    englishName: "Daejeon",
    fullAddress: "대전광역시 서구 둔산로 100 (대전시청)",
    x: 40,
    y: 44,
    temp: 29.0,
    humidity: 73,
    wind: 1.9,
    rain: 0.0,
    condition: "cloudy",
    radarForecast: [0.0, 0.8, 3.2, 5.5, 4.0, 1.5],
  },
  {
    id: "sejong",
    name: "세종",
    englishName: "Sejong",
    fullAddress: "세종특별자치시 한누리대로 2130 (세종시청)",
    x: 37,
    y: 39,
    temp: 28.7,
    humidity: 74,
    wind: 1.7,
    rain: 0.0,
    condition: "cloudy",
    radarForecast: [0.0, 1.0, 4.2, 5.0, 3.5, 0.8],
  },
  {
    id: "jeonbuk",
    name: "전북",
    englishName: "Jeonbuk",
    fullAddress: "전북특별자치도 전주시 완산구 효자로 225 (전북도청)",
    x: 32,
    y: 56,
    temp: 29.8,
    humidity: 68,
    wind: 2.4,
    rain: 0.0,
    condition: "sunny",
    radarForecast: [0.0, 0.0, 1.2, 3.5, 2.0, 0.0],
  },
  {
    id: "jeonnam",
    name: "전남",
    englishName: "Jeonnam",
    fullAddress: "전라남도 무안군 삼향읍 오룡길 1 (전남도청)",
    x: 26,
    y: 72,
    temp: 30.2,
    humidity: 65,
    wind: 3.1,
    rain: 0.0,
    condition: "sunny",
    radarForecast: [0.0, 0.0, 0.0, 0.8, 1.5, 0.2],
  },
  {
    id: "gwangju",
    name: "광주",
    englishName: "Gwangju",
    fullAddress: "광주광역시 서구 내방로 111 (광주시청)",
    x: 28,
    y: 67,
    temp: 30.5,
    humidity: 66,
    wind: 2.0,
    rain: 0.0,
    condition: "sunny",
    radarForecast: [0.0, 0.0, 0.0, 0.5, 1.0, 0.0],
  },
  {
    id: "gyeongbuk",
    name: "경북",
    englishName: "Gyeongbuk",
    fullAddress: "경상북도 안동시 풍천면 도청대로 455 (경상북도청)",
    x: 64,
    y: 44,
    temp: 31.4,
    humidity: 58,
    wind: 2.8,
    rain: 0.0,
    condition: "sunny",
    radarForecast: [0.0, 0.0, 0.0, 1.2, 3.8, 5.2],
  },
  {
    id: "gyeongnam",
    name: "경남",
    englishName: "Gyeongnam",
    fullAddress: "경상남도 창원시 의창구 중앙대로 300 (경상남도청)",
    x: 54,
    y: 64,
    temp: 30.8,
    humidity: 62,
    wind: 2.5,
    rain: 0.0,
    condition: "sunny",
    radarForecast: [0.0, 0.0, 0.0, 0.2, 1.1, 2.8],
  },
  {
    id: "daegu",
    name: "대구",
    englishName: "Daegu",
    fullAddress: "대구광역시 중구 공평로 88 (대구시청 동인청사)",
    x: 58,
    y: 53,
    temp: 32.5,
    humidity: 55,
    wind: 1.6,
    rain: 0.0,
    condition: "sunny",
    radarForecast: [0.0, 0.0, 0.0, 0.5, 2.5, 4.0],
  },
  {
    id: "ulsan",
    name: "울산",
    englishName: "Ulsan",
    fullAddress: "울산광역시 남구 중앙로 201 (울산시청)",
    x: 69,
    y: 58,
    temp: 29.5,
    humidity: 65,
    wind: 4.2,
    rain: 0.0,
    condition: "sunny",
    radarForecast: [0.0, 0.0, 0.0, 0.0, 0.8, 3.5],
  },
  {
    id: "busan",
    name: "부산",
    englishName: "Busan",
    fullAddress: "부산광역시 연제구 중앙대로 1001 (부산시청)",
    x: 64,
    y: 68,
    temp: 29.1,
    humidity: 68,
    wind: 4.5,
    rain: 0.0,
    condition: "sunny",
    radarForecast: [0.0, 0.0, 0.0, 0.0, 0.5, 2.1],
  },
  {
    id: "jeju",
    name: "제주",
    englishName: "Jeju",
    fullAddress: "제주특별자치도 제주시 문송길 12 (제주도청)",
    x: 25,
    y: 93,
    temp: 28.2,
    humidity: 88,
    wind: 5.6,
    rain: 18.5,
    condition: "thunderstorm",
    radarForecast: [18.5, 22.0, 25.0, 15.0, 8.2, 2.0],
  },
];

// Historical warming trends in Korea (Average decadal statistics)
export const historicalClimateData: ClimateTrend[] = [
  { year: 1990, avgTemp: 11.8, heatwaveDays: 7.2, tropicalNights: 4.5, precipitation: 1250 },
  { year: 1995, avgTemp: 12.1, heatwaveDays: 9.5, tropicalNights: 5.1, precipitation: 1180 },
  { year: 2000, avgTemp: 12.3, heatwaveDays: 10.1, tropicalNights: 6.2, precipitation: 1320 },
  { year: 2005, avgTemp: 12.5, heatwaveDays: 11.2, tropicalNights: 7.0, precipitation: 1290 },
  { year: 2010, avgTemp: 12.8, heatwaveDays: 12.8, tropicalNights: 8.8, precipitation: 1450 },
  { year: 2015, avgTemp: 13.2, heatwaveDays: 15.2, tropicalNights: 11.5, precipitation: 1120 },
  { year: 2020, avgTemp: 13.5, heatwaveDays: 18.5, tropicalNights: 14.2, precipitation: 1590 },
  { year: 2025, avgTemp: 13.9, heatwaveDays: 21.0, tropicalNights: 16.5, precipitation: 1350 },
];

// Future projection scenarios for Korea (RCP 4.5 vs RCP 8.5)
export const rcpScenariosData: RCPScenario[] = [
  { year: 2025, rcp45Temp: 13.9, rcp85Temp: 13.9, rcp45Days: 21, rcp85Days: 21 },
  { year: 2030, rcp45Temp: 14.2, rcp85Temp: 14.5, rcp45Days: 23, rcp85Days: 26 },
  { year: 2035, rcp45Temp: 14.5, rcp85Temp: 15.1, rcp45Days: 26, rcp85Days: 32 },
  { year: 2040, rcp45Temp: 14.8, rcp85Temp: 15.8, rcp45Days: 29, rcp85Days: 39 },
  { year: 2045, rcp45Temp: 15.0, rcp85Temp: 16.4, rcp45Days: 31, rcp85Days: 45 },
  { year: 2050, rcp45Temp: 15.3, rcp85Temp: 17.2, rcp45Days: 34, rcp85Days: 52 },
];
