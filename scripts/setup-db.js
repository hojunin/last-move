require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");
const fs = require("fs");
const path = require("path");

async function setupDatabase() {
  try {
    console.log("🚀 데이터베이스 초기화를 시작합니다...");

    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, "..", "sql", "init.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    // SQL 스크립트를 세미콜론으로 분리
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 ${statements.length}개의 SQL 문을 실행합니다...`);

    // 각 SQL 문을 순차적으로 실행
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`⚙️  실행 중: ${statement.substring(0, 50)}...`);
          await sql.query(statement);
          console.log(`✅ 완료: ${i + 1}/${statements.length}`);
        } catch (error) {
          console.error(`❌ 오류 발생:`, error.message);
          console.log(`SQL: ${statement}`);
        }
      }
    }

    console.log("🎉 데이터베이스 초기화가 완료되었습니다!");

    // 테이블 확인
    const result = await sql`SELECT COUNT(*) as count FROM last_move_items`;
    console.log(`📊 생성된 샘플 데이터: ${result.rows[0].count}개`);
  } catch (error) {
    console.error("💥 데이터베이스 초기화 실패:", error);
  } finally {
    process.exit(0);
  }
}

setupDatabase();
