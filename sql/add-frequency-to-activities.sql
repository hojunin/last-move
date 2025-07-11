-- 활동 주기 기능을 위한 데이터베이스 마이그레이션

-- 1. 활동 주기 타입 ENUM 생성 (이미 존재하는 경우 무시)
CREATE TYPE frequency_type AS ENUM ('preset', 'custom');

-- 2. 활동 주기 단위 ENUM 생성 (이미 존재하는 경우 무시)
CREATE TYPE frequency_unit AS ENUM ('days', 'weeks', 'months', 'quarters', 'years');

-- 3. activities 테이블에 주기 관련 컬럼 추가
ALTER TABLE activities ADD COLUMN frequency_type frequency_type DEFAULT 'preset';
ALTER TABLE activities ADD COLUMN frequency_value INTEGER DEFAULT 1;
ALTER TABLE activities ADD COLUMN frequency_unit frequency_unit DEFAULT 'days';

-- 4. 기존 데이터에 기본값 설정
UPDATE activities 
SET 
    frequency_type = 'preset',
    frequency_value = 1,
    frequency_unit = 'days'
WHERE frequency_type IS NULL;

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_activities_frequency_type ON activities(frequency_type);
CREATE INDEX IF NOT EXISTS idx_activities_frequency_value ON activities(frequency_value);
CREATE INDEX IF NOT EXISTS idx_activities_frequency_unit ON activities(frequency_unit);

-- 6. 복합 인덱스 생성 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_activities_frequency_composite ON activities(frequency_type, frequency_value, frequency_unit); 