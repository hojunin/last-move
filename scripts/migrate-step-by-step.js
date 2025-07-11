require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function migrate() {
  try {
    console.log(
      "🚀 Starting database migration to activities and moves structure..."
    );

    // 1. activities 테이블 생성
    console.log("📋 Step 1: Creating activities table...");
    await sql`
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
      )
    `;
    console.log("✅ Activities table created");

    // 2. moves 테이블 생성
    console.log("📋 Step 2: Creating moves table...");
    await sql`
      CREATE TABLE IF NOT EXISTS moves (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✅ Moves table created");

    // 3. 트리거 생성 (이미 존재할 수 있으므로 오류 무시)
    console.log("📋 Step 3: Creating trigger...");
    try {
      await sql`
        CREATE TRIGGER set_timestamp_activities
          BEFORE UPDATE ON activities
          FOR EACH ROW
          EXECUTE PROCEDURE trigger_set_timestamp()
      `;
      console.log("✅ Trigger created");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Trigger already exists, skipping");
      } else {
        throw error;
      }
    }

    // 4. 인덱스 생성
    console.log("📋 Step 4: Creating indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_title ON activities(title)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_moves_activity_id ON moves(activity_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_moves_executed_at ON moves(executed_at)`;
    console.log("✅ Indexes created");

    // 5. 데이터 마이그레이션
    console.log("📋 Step 5: Migrating data from last_move_items...");

    // 기존 데이터가 있는지 확인
    const existingData = await sql`
      SELECT COUNT(*) as count FROM last_move_items
    `;

    if (existingData.rows[0].count > 0) {
      // activities로 데이터 이동
      await sql`
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
        ON CONFLICT (title) DO NOTHING
      `;

      // moves로 데이터 이동
      await sql`
        INSERT INTO moves (activity_id, executed_at)
        SELECT 
          a.id,
          lmi.last_action_at
        FROM last_move_items lmi
        JOIN activities a ON a.title = lmi.title
        WHERE lmi.action_count > 0
      `;

      console.log("✅ Data migrated successfully");
    } else {
      console.log("ℹ️  No existing data to migrate");
    }

    // 6. 마이그레이션 검증
    console.log("🔍 Verifying migration...");

    const activitiesResult =
      await sql`SELECT COUNT(*) as count FROM activities`;
    const movesResult = await sql`SELECT COUNT(*) as count FROM moves`;

    console.log(
      `📊 Activities table: ${activitiesResult.rows[0].count} records`
    );
    console.log(`📊 Moves table: ${movesResult.rows[0].count} records`);

    console.log("✅ Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  migrate()
    .then(() => {
      console.log("🎉 Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrate };
