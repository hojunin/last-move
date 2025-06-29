require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");
const fs = require("fs");
const path = require("path");

async function migrate() {
  try {
    console.log(
      "🚀 Starting database migration to activities and moves structure..."
    );

    // SQL 파일 읽기
    const sqlPath = path.join(
      __dirname,
      "..",
      "sql",
      "migrate-to-activities.sql"
    );
    const migrationSQL = fs.readFileSync(sqlPath, "utf8");

    // SQL 문을 세미콜론으로 분리
    const statements = migrationSQL
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
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        console.error("Statement:", statement);
        // 일부 오류는 무시하고 계속 진행 (예: 이미 존재하는 테이블)
        if (!error.message.includes("already exists")) {
          throw error;
        }
      }
    }

    // 마이그레이션 검증
    console.log("🔍 Verifying migration...");

    const activitiesResult =
      await sql`SELECT COUNT(*) as count FROM activities`;
    const movesResult = await sql`SELECT COUNT(*) as count FROM moves`;

    console.log(
      `📊 Activities table: ${activitiesResult.rows[0].count} records`
    );
    console.log(`📊 Moves table: ${movesResult.rows[0].count} records`);

    console.log("✅ Database migration completed successfully!");
    console.log("");
    console.log("📝 Migration Summary:");
    console.log("- Created activities table for managing activity definitions");
    console.log("- Created moves table for tracking activity executions");
    console.log("- Migrated existing data from last_move_items");
    console.log("- Added proper indexes and relationships");
    console.log("");
    console.log(
      "⚠️  Note: The old last_move_items table is still available for backup."
    );
    console.log(
      "   You can manually drop it once you verify everything works correctly."
    );
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
