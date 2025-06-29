-- PWA 푸시 알림 시스템을 위한 데이터베이스 스키마

-- 1. 알림 타입 ENUM 생성
CREATE TYPE notification_type AS ENUM (
  'daily_reminder',      -- 일일 리마인더 (오늘 미완료 활동)
  'weekly_reminder',     -- 주간 리마인더 (주간 미완료 활동)  
  'long_inactive',       -- 장기 미실행 알림 (7일+ 미실행)
  'streak_celebration',  -- 연속 기록 축하 (3일, 7일, 30일)
  'goal_achievement',    -- 목표 달성 축하
  'encouragement',       -- 격려 메시지
  'custom'              -- 사용자 정의 알림
);

-- 2. 알림 우선순위 ENUM 생성
CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal', 
  'high',
  'urgent'
);

-- 3. 사용자 알림 설정 테이블
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) DEFAULT 'default_user', -- 추후 사용자 시스템 확장용
  daily_reminder_enabled BOOLEAN DEFAULT true,
  daily_reminder_time TIME DEFAULT '23:00:00', -- 저녁 11시
  weekly_reminder_enabled BOOLEAN DEFAULT true,
  weekly_reminder_day INTEGER DEFAULT 5, -- 금요일 (0=일요일, 6=토요일)
  weekly_reminder_time TIME DEFAULT '18:00:00', -- 저녁 6시
  long_inactive_enabled BOOLEAN DEFAULT true,
  long_inactive_days INTEGER DEFAULT 7, -- 7일 후 알림
  streak_celebration_enabled BOOLEAN DEFAULT true,
  goal_achievement_enabled BOOLEAN DEFAULT true,
  push_subscription TEXT, -- 푸시 구독 정보 (JSON)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) DEFAULT 'default_user',
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'normal',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  icon VARCHAR(255) DEFAULT '/icon-192x192.png',
  badge VARCHAR(255) DEFAULT '/badge-72x72.png',
  data JSONB, -- 추가 데이터 (activity 정보, 통계 등)
  scheduled_at TIMESTAMPTZ NOT NULL, -- 발송 예정 시간
  sent_at TIMESTAMPTZ, -- 실제 발송 시간
  read_at TIMESTAMPTZ, -- 읽은 시간
  clicked_at TIMESTAMPTZ, -- 클릭한 시간
  is_sent BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  is_clicked BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 알림 스케줄 테이블 (정기 알림 관리)
CREATE TABLE IF NOT EXISTS notification_schedules (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  cron_expression VARCHAR(255), -- cron 형식 스케줄 (예: "0 23 * * *")
  next_run_at TIMESTAMPTZ, -- 다음 실행 시간
  last_run_at TIMESTAMPTZ, -- 마지막 실행 시간
  conditions JSONB, -- 알림 발송 조건 (예: {"min_days_since_last": 1})
  template_data JSONB, -- 알림 템플릿 데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 알림 통계 테이블 (성과 추적용)
CREATE TABLE IF NOT EXISTS notification_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type notification_type NOT NULL,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, type)
);

-- 7. 트리거 생성 (updated_at 자동 업데이트)
CREATE TRIGGER set_timestamp_user_notification_settings
  BEFORE UPDATE ON user_notification_settings
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_notification_schedules
  BEFORE UPDATE ON notification_schedules
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- 8. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_activity_id ON notifications(activity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_activity_id ON notification_schedules(activity_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_next_run_at ON notification_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_is_active ON notification_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_stats_date_type ON notification_stats(date, type);

-- 9. 기본 사용자 알림 설정 삽입
INSERT INTO user_notification_settings (user_id) 
VALUES ('default_user')
ON CONFLICT DO NOTHING; 