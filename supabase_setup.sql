-- =========================================================================
--  Supabase SQL Editor Setup: 기후 예측 및 AI 브리핑 시스템 데이터베이스 스키마
-- =========================================================================

DROP TABLE IF EXISTS weather_observations CASCADE;
DROP TABLE IF EXISTS climate_trends CASCADE;
DROP TABLE IF EXISTS rcp_scenarios CASCADE;
DROP TABLE IF EXISTS user_feedbacks CASCADE;

-- (1) 전국 실시간 기상 관측 및 초단기 레이더 예측 테이블
CREATE TABLE weather_observations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    english_name VARCHAR(50) NOT NULL,
    x NUMERIC NOT NULL,
    y NUMERIC NOT NULL,
    temp NUMERIC NOT NULL,
    humidity INTEGER NOT NULL,
    wind NUMERIC NOT NULL,
    rain NUMERIC NOT NULL,
    condition VARCHAR(50) NOT NULL,
    radar_forecast NUMERIC[] NOT NULL, -- 6개 단계별 초단기 예보 배열
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- (2) 과거 기후 변화 데이터 테이블
CREATE TABLE climate_trends (
    year INTEGER PRIMARY KEY,
    avg_temp NUMERIC NOT NULL,
    heatwave_days NUMERIC NOT NULL,
    tropical_nights NUMERIC NOT NULL,
    precipitation NUMERIC NOT NULL
);

-- (3) 한반도 미래 기후 예측 RCP 시나리오 테이블
CREATE TABLE rcp_scenarios (
    year INTEGER PRIMARY KEY,
    rcp45_temp NUMERIC NOT NULL,
    rcp85_temp NUMERIC NOT NULL,
    rcp45_days INTEGER NOT NULL,
    rcp85_days INTEGER NOT NULL
);

-- (4) 사용자 맞춤 건의사항 및 기후 피드백 로그 테이블 (추후 확장용)
CREATE TABLE user_feedbacks (
    id BIGSERIAL PRIMARY KEY,
    region_id VARCHAR(50) REFERENCES weather_observations(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 시드 데이터 삽입
INSERT INTO weather_observations (id, name, english_name, x, y, temp, humidity, wind, rain, condition, radar_forecast) VALUES
('seoul', '서울', 'Seoul', 35, 22, 27.5, 82, 2.1, 8.5, 'rainy', ARRAY[8.5, 12.0, 15.5, 7.0, 3.2, 0.5]),
('incheon', '인천', 'Incheon', 26, 22, 26.8, 85, 4.8, 11.2, 'rainy', ARRAY[11.2, 8.0, 4.2, 1.5, 0.2, 0.0]),
('gyeonggi', '경기', 'Gyeonggi', 42, 25, 27.2, 80, 1.8, 6.0, 'rainy', ARRAY[6.0, 10.5, 12.0, 9.5, 5.0, 1.2]),
('gangwon', '강원', 'Gangwon', 58, 18, 24.5, 78, 3.5, 3.0, 'cloudy', ARRAY[3.0, 5.2, 9.8, 14.0, 11.5, 6.0]),
('chungbuk', '충북', 'Chungbuk', 46, 38, 28.1, 75, 1.5, 0.0, 'cloudy', ARRAY[0.0, 1.5, 4.0, 8.5, 9.0, 4.2]),
('chungnam', '충남', 'Chungnam', 30, 42, 28.5, 78, 2.2, 1.2, 'cloudy', ARRAY[1.2, 3.5, 6.8, 4.0, 1.2, 0.0]),
('daejeon', '대전', 'Daejeon', 40, 44, 29.0, 73, 1.9, 0.0, 'cloudy', ARRAY[0.0, 0.8, 3.2, 5.5, 4.0, 1.5]),
('sejong', '세종', 'Sejong', 37, 39, 28.7, 74, 1.7, 0.0, 'cloudy', ARRAY[0.0, 1.0, 4.2, 5.0, 3.5, 0.8]),
('jeonbuk', '전북', 'Jeonbuk', 32, 56, 29.8, 68, 2.4, 0.0, 'sunny', ARRAY[0.0, 0.0, 1.2, 3.5, 2.0, 0.0]),
('jeonnam', '전남', 'Jeonnam', 26, 72, 30.2, 65, 3.1, 0.0, 'sunny', ARRAY[0.0, 0.0, 0.0, 0.8, 1.5, 0.2]),
('gwangju', '광주', 'Gwangju', 28, 67, 30.5, 66, 2.0, 0.0, 'sunny', ARRAY[0.0, 0.0, 0.0, 0.5, 1.0, 0.0]),
('gyeongbuk', '경북', 'Gyeongbuk', 64, 44, 31.4, 58, 2.8, 0.0, 'sunny', ARRAY[0.0, 0.0, 0.0, 1.2, 3.8, 5.2]),
('gyeongnam', '경남', 'Gyeongnam', 54, 64, 30.8, 62, 2.5, 0.0, 'sunny', ARRAY[0.0, 0.0, 0.0, 0.2, 1.1, 2.8]),
('daegu', '대구', 'Daegu', 58, 53, 32.5, 55, 1.6, 0.0, 'sunny', ARRAY[0.0, 0.0, 0.0, 0.5, 2.5, 4.0]),
('ulsan', '울산', 'Ulsan', 69, 58, 29.5, 65, 4.2, 0.0, 'sunny', ARRAY[0.0, 0.0, 0.0, 0.0, 0.8, 3.5]),
('busan', '부산', 'Busan', 64, 68, 29.1, 68, 4.5, 0.0, 'sunny', ARRAY[0.0, 0.0, 0.0, 0.0, 0.5, 2.1]),
('jeju', '제주', 'Jeju', 25, 93, 28.2, 88, 5.6, 18.5, 'thunderstorm', ARRAY[18.5, 22.0, 25.0, 15.0, 8.2, 2.0]);

INSERT INTO climate_trends (year, avg_temp, heatwave_days, tropical_nights, precipitation) VALUES
(1990, 11.8, 7.2, 4.5, 1250),
(1995, 12.1, 9.5, 5.1, 1180),
(2000, 12.3, 10.1, 6.2, 1320),
(2005, 12.5, 11.2, 7.0, 1290),
(2010, 12.8, 12.8, 8.8, 1450),
(2015, 13.2, 15.2, 11.5, 1120),
(2020, 13.5, 18.5, 14.2, 1590),
(2025, 13.9, 21.0, 16.5, 1350);

INSERT INTO rcp_scenarios (year, rcp45_temp, rcp85_temp, rcp45_days, rcp85_days) VALUES
(2025, 13.9, 13.9, 21, 21),
(2030, 14.2, 14.5, 23, 26),
(2035, 14.5, 15.1, 26, 32),
(2040, 14.8, 15.8, 29, 39),
(2045, 15.0, 16.4, 31, 45),
(2050, 15.3, 17.2, 34, 52);

CREATE INDEX idx_weather_name ON weather_observations(name);
