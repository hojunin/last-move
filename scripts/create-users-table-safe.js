const { sql } = require("@vercel/postgres");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

async function createUsersTablesSafe() {
  try {
    console.log("🔧 사용자 인증 테이블 안전 생성 시작...");

    // SQL 파일 읽기
    const sqlFilePath = path.join(
      __dirname,
      "..",
      "sql",
      "create-users-table-safe.sql"
    );
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    // SQL 실행
    await sql.query(sqlContent);
    console.log("✅ 사용자 인증 테이블 생성 완료");

    // 테이블 확인
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens')
      ORDER BY table_name;
    `;

    console.log("\n📋 생성된 인증 테이블:");
    tables.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // 기존 테이블의 user_id 컬럼 확인
    const userIdColumns = await sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name = 'user_id'
      ORDER BY table_name;
    `;

    console.log("\n🔗 user_id 컬럼이 추가된 테이블:");
    userIdColumns.rows.forEach((row) => {
      console.log(
        `  - ${row.table_name}.${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`
      );
    });

    // 사용자 데이터 확인
    const users = await sql`SELECT id, email, name FROM users ORDER BY id`;
    console.log("\n👥 등록된 사용자:");
    users.rows.forEach((user) => {
      console.log(
        `  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`
      );
    });

    console.log("\n🎉 사용자 인증 시스템 데이터베이스 설정 완료!");
  } catch (error) {
    console.error("❌ 사용자 테이블 생성 중 오류:", error);
    throw error;
  }
}

if (require.main === module) {
  createUsersTablesSafe()
    .then(() => {
      console.log("스크립트 실행 완료");
      process.exit(0);
    })
    .catch((error) => {
      console.error("스크립트 실행 실패:", error);
      process.exit(1);
    });
}

module.exports = { createUsersTablesSafe };
