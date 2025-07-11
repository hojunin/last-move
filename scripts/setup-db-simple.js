require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function setupDatabase() {
  try {
    console.log("🚀 데이터베이스 초기화를 시작합니다...");

    // 1. ENUM 타입 생성
    console.log("📝 ENUM 타입 생성 중...");
    await sql`CREATE TYPE reminder_rule_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'custom')`;
    console.log("✅ ENUM 타입 생성 완료");

    // 2. 트리거 함수 생성
    console.log("📝 트리거 함수 생성 중...");
    await sql`
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    console.log("✅ 트리거 함수 생성 완료");

    // 3. 테이블 생성
    console.log("📝 테이블 생성 중...");
    await sql`
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
        reminder_days_of_week INTEGER[]
      )
    `;
    console.log("✅ 테이블 생성 완료");

    // 4. 트리거 생성
    console.log("📝 트리거 생성 중...");
    await sql`
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON last_move_items
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp()
    `;
    console.log("✅ 트리거 생성 완료");

    // 5. 인덱스 생성
    console.log("📝 인덱스 생성 중...");
    await sql`CREATE INDEX IF NOT EXISTS idx_last_move_items_last_action_at ON last_move_items(last_action_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_last_move_items_category ON last_move_items(category)`;
    console.log("✅ 인덱스 생성 완료");

    // 6. 샘플 데이터 삽입
    console.log("📝 샘플 데이터 삽입 중...");
    await sql`
      INSERT INTO last_move_items (title, category, last_action_at, action_count) VALUES
        ('운동하기', '건강', NOW() - INTERVAL '3 days', 15),
        ('책 읽기', '학습', NOW() - INTERVAL '1 day', 8),
        ('방 청소', '생활', NOW() - INTERVAL '7 days', 4),
        ('친구 연락', '인간관계', NOW() - INTERVAL '5 days', 12)
      ON CONFLICT DO NOTHING
    `;
    console.log("✅ 샘플 데이터 삽입 완료");

    // 7. 결과 확인
    const result = await sql`SELECT COUNT(*) as count FROM last_move_items`;
    console.log(`📊 생성된 데이터: ${result.rows[0].count}개`);

    console.log("🎉 데이터베이스 초기화가 완료되었습니다!");
  } catch (error) {
    console.error("💥 오류 발생:", error.message);
    console.error("전체 오류:", error);
  } finally {
    process.exit(0);
  }
}

setupDatabase();
