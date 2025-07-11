-- 사용자 인증 시스템을 위한 안전한 데이터베이스 마이그레이션

-- 1. users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 세션 테이블 생성 (NextAuth.js용)
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- 3. 기본 관리자 사용자 생성
INSERT INTO users (id, email, password_hash, name, email_verified, is_active)
VALUES (1, 'admin@lastmove.app', '$2a$12$placeholder_hash', 'Admin User', true, true)
ON CONFLICT (id) DO NOTHING;

-- 4. 기존 테이블에 user_id 컬럼 추가 (안전한 방식)
DO $$ 
BEGIN
    -- activities 테이블에 user_id 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activities' AND column_name='user_id') THEN
        ALTER TABLE activities ADD COLUMN user_id INTEGER;
        -- 기존 데이터를 관리자 사용자에게 할당
        UPDATE activities SET user_id = 1 WHERE user_id IS NULL;
        -- NOT NULL 제약 조건 및 외래키 추가
        ALTER TABLE activities ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE activities ADD CONSTRAINT fk_activities_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- moves 테이블에 user_id 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='moves' AND column_name='user_id') THEN
        ALTER TABLE moves ADD COLUMN user_id INTEGER;
        UPDATE moves SET user_id = 1 WHERE user_id IS NULL;
        ALTER TABLE moves ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE moves ADD CONSTRAINT fk_moves_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- notifications 테이블 처리 (문자열 -> 정수 변환)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='notifications' AND column_name='user_id' AND data_type='character varying') THEN
        -- 임시 컬럼 생성
        ALTER TABLE notifications ADD COLUMN user_id_temp INTEGER;
        -- 기존 데이터를 관리자 사용자에게 할당
        UPDATE notifications SET user_id_temp = 1;
        -- 기존 컬럼 삭제 및 새 컬럼 이름 변경
        ALTER TABLE notifications DROP COLUMN user_id;
        ALTER TABLE notifications RENAME COLUMN user_id_temp TO user_id;
        -- NOT NULL 제약 조건 및 외래키 추가
        ALTER TABLE notifications ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='notifications' AND column_name='user_id') THEN
        -- user_id 컬럼이 없는 경우 새로 추가
        ALTER TABLE notifications ADD COLUMN user_id INTEGER;
        UPDATE notifications SET user_id = 1 WHERE user_id IS NULL;
        ALTER TABLE notifications ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- user_notification_settings 테이블 처리
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='user_notification_settings' AND column_name='user_id' AND data_type='character varying') THEN
        ALTER TABLE user_notification_settings ADD COLUMN user_id_temp INTEGER;
        UPDATE user_notification_settings SET user_id_temp = 1;
        ALTER TABLE user_notification_settings DROP COLUMN user_id;
        ALTER TABLE user_notification_settings RENAME COLUMN user_id_temp TO user_id;
        ALTER TABLE user_notification_settings ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE user_notification_settings ADD CONSTRAINT fk_user_notification_settings_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='user_notification_settings' AND column_name='user_id') THEN
        ALTER TABLE user_notification_settings ADD COLUMN user_id INTEGER;
        UPDATE user_notification_settings SET user_id = 1 WHERE user_id IS NULL;
        ALTER TABLE user_notification_settings ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE user_notification_settings ADD CONSTRAINT fk_user_notification_settings_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. 트리거 생성 (updated_at 자동 업데이트)
CREATE TRIGGER set_timestamp_users
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_accounts
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_sessions
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_moves_user_id ON moves(user_id); 