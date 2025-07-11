require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");
const fs = require("fs");
const path = require("path");

async function createNotificationTables() {
  try {
    console.log("🚀 Creating notification system tables...");

    // SQL 파일 읽기
    const sqlPath = path.join(
      __dirname,
      "..",
      "sql",
      "create-notification-tables.sql"
    );
    const createTablesSQL = fs.readFileSync(sqlPath, "utf8");

    // SQL 문을 세미콜론으로 분리
    const statements = createTablesSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // 각 SQL 문 실행
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

      try {
        await sql.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        // 일부 오류는 무시하고 계속 진행 (예: 이미 존재하는 타입/테이블)
        if (
          !error.message.includes("already exists") &&
          !error.message.includes("duplicate key")
        ) {
          throw error;
        } else {
          console.log(`ℹ️  Skipping due to existing object`);
        }
      }
    }

    // 테이블 생성 검증
    console.log("🔍 Verifying table creation...");

    const tables = [
      "user_notification_settings",
      "notifications",
      "notification_schedules",
      "notification_stats",
    ];

    for (const table of tables) {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = ${table}
      `;

      if (result.rows[0].count > 0) {
        console.log(`✅ Table '${table}' created successfully`);
      } else {
        console.log(`❌ Table '${table}' not found`);
      }
    }

    // 기본 설정 확인
    const settingsResult = await sql`
      SELECT COUNT(*) as count FROM user_notification_settings
    `;
    console.log(
      `📊 User notification settings: ${settingsResult.rows[0].count} records`
    );

    console.log("✅ Notification system tables created successfully!");
    console.log("");
    console.log("📝 Created Tables:");
    console.log("- user_notification_settings: 사용자 알림 설정");
    console.log("- notifications: 알림 메시지 저장");
    console.log("- notification_schedules: 정기 알림 스케줄");
    console.log("- notification_stats: 알림 통계");
    console.log("");
    console.log("📋 Notification Types:");
    console.log("- daily_reminder: 일일 리마인더");
    console.log("- weekly_reminder: 주간 리마인더");
    console.log("- long_inactive: 장기 미실행 알림");
    console.log("- streak_celebration: 연속 기록 축하");
    console.log("- goal_achievement: 목표 달성 축하");
  } catch (error) {
    console.error("❌ Failed to create notification tables:", error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  createNotificationTables()
    .then(() => {
      console.log("🎉 Notification tables creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = { createNotificationTables };
