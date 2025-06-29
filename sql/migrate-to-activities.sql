-- LastMove 애플리케이션 데이터 구조 개선
-- activities와 moves 테이블로 분리

-- 1. activities 테이블 생성 (활동 정의)
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  description TEXT,
  reminder_rule_type reminder_rule_type DEFAULT 'none',
  reminder_interval INTEGER,
  reminder_days_of_week INTEGER[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. moves 테이블 생성 (활동 실행 기록)
CREATE TABLE IF NOT EXISTS moves (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 트리거 함수 (activities 테이블용)
CREATE TRIGGER set_timestamp_activities
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_activities_title ON activities(title);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active);
CREATE INDEX IF NOT EXISTS idx_moves_activity_id ON moves(activity_id);
CREATE INDEX IF NOT EXISTS idx_moves_executed_at ON moves(executed_at);

-- 5. 기존 데이터 마이그레이션
-- 기존 last_move_items에서 activities로 데이터 이동
INSERT INTO activities (title, category, reminder_rule_type, reminder_interval, reminder_days_of_week, created_at, updated_at)
SELECT DISTINCT 
  title, 
  category, 
  reminder_rule_type, 
  reminder_interval, 
  reminder_days_of_week,
  created_at,
  updated_at
FROM last_move_items
ON CONFLICT (title) DO NOTHING;

-- 6. moves 테이블에 기존 실행 기록 생성
-- 각 활동의 마지막 실행일과 실행 횟수를 기반으로 moves 생성
INSERT INTO moves (activity_id, executed_at)
SELECT 
  a.id,
  lmi.last_action_at
FROM last_move_items lmi
JOIN activities a ON a.title = lmi.title
WHERE lmi.action_count > 0;

-- 7. 추가 moves 생성 (action_count > 1인 경우 더미 데이터)
-- 실제로는 정확한 실행 기록이 없으므로 간격을 두고 생성
DO $$
DECLARE
  rec RECORD;
  i INTEGER;
BEGIN
  FOR rec IN 
    SELECT lmi.title, lmi.action_count, lmi.last_action_at, a.id as activity_id
    FROM last_move_items lmi
    JOIN activities a ON a.title = lmi.title
    WHERE lmi.action_count > 1
  LOOP
    -- action_count - 1개의 추가 기록 생성 (과거 날짜로)
    FOR i IN 1..(rec.action_count - 1) LOOP
      INSERT INTO moves (activity_id, executed_at)
      VALUES (
        rec.activity_id,
        rec.last_action_at - INTERVAL '1 day' * i
      );
    END LOOP;
  END LOOP;
END $$;

-- 8. 기존 테이블 백업 후 제거 (선택사항)
-- ALTER TABLE last_move_items RENAME TO last_move_items_backup;
-- 또는 완전 삭제: DROP TABLE last_move_items; 