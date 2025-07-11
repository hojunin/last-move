-- LastMove 애플리케이션을 위한 데이터베이스 스키마

-- 리마인더 규칙 타입 ENUM 생성
CREATE TYPE reminder_rule_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'custom');

-- 타임스탬프 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- last_move_items 테이블 생성
CREATE TABLE IF NOT EXISTS last_move_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reminder_rule_type reminder_rule_type DEFAULT 'none',
  reminder_interval INTEGER,
  reminder_days_of_week INTEGER[] -- 0=일요일, 1=월요일, ..., 6=토요일
);

-- updated_at 자동 업데이트 트리거 생성
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON last_move_items
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_last_move_items_last_action_at ON last_move_items(last_action_at);
CREATE INDEX IF NOT EXISTS idx_last_move_items_category ON last_move_items(category);

-- 샘플 데이터 삽입 (개발용)
INSERT INTO last_move_items (title, category, last_action_at, action_count) VALUES
  ('운동하기', '건강', NOW() - INTERVAL '3 days', 15),
  ('책 읽기', '학습', NOW() - INTERVAL '1 day', 8),
  ('방 청소', '생활', NOW() - INTERVAL '7 days', 4),
  ('친구 연락', '인간관계', NOW() - INTERVAL '5 days', 12)
ON CONFLICT DO NOTHING; 