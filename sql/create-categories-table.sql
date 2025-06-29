-- 카테고리 관리를 위한 데이터베이스 스키마

-- 1. categories 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- HEX 색상 코드 (예: #FF5733)
  icon VARCHAR(50), -- 아이콘 이름 또는 이모지
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 트리거 생성 (updated_at 자동 업데이트)
CREATE TRIGGER set_timestamp_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- 4. 기본 카테고리 데이터 삽입
INSERT INTO categories (name, description, color, icon, sort_order) VALUES
  ('건강', '운동, 식단, 수면 등 건강 관련 활동', '#4CAF50', '💪', 1),
  ('학습', '독서, 공부, 온라인 강의 등 학습 활동', '#2196F3', '📚', 2),
  ('생활', '청소, 정리, 집안일 등 일상 생활', '#FF9800', '🏠', 3),
  ('취미', '음악, 그림, 게임 등 취미 활동', '#E91E63', '🎨', 4),
  ('인간관계', '가족, 친구, 동료와의 관계 관리', '#9C27B0', '👥', 5),
  ('업무', '직장, 프로젝트, 업무 관련 활동', '#607D8B', '💼', 6),
  ('자기계발', '명상, 일기, 목표 설정 등', '#795548', '🌱', 7),
  ('기타', '분류되지 않은 기타 활동', '#9E9E9E', '📝', 8)
ON CONFLICT (name) DO NOTHING;

-- 5. activities 테이블에 category_id 컬럼 추가 (기존 category 컬럼과 병행)
DO $$ 
BEGIN
    -- category_id 컬럼이 없는 경우에만 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activities' AND column_name='category_id') THEN
        ALTER TABLE activities ADD COLUMN category_id INTEGER REFERENCES categories(id);
        
        -- 기존 category 문자열을 category_id로 매핑
        UPDATE activities SET category_id = (
            SELECT id FROM categories WHERE name = activities.category
        ) WHERE category IS NOT NULL;
        
        -- 매핑되지 않은 경우 '기타' 카테고리로 설정
        UPDATE activities SET category_id = (
            SELECT id FROM categories WHERE name = '기타'
        ) WHERE category_id IS NULL;
    END IF;
END $$;

-- 6. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_activities_category_id ON activities(category_id); 