require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function createCategoriesTable() {
  try {
    console.log(
      "🚀 Creating categories table and setting up category management..."
    );

    // 1. categories 테이블 생성
    console.log("📋 Step 1: Creating categories table...");
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7),
        icon VARCHAR(50),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✅ Categories table created");

    // 2. 트리거 생성
    console.log("📋 Step 2: Creating trigger...");
    try {
      await sql`
        CREATE TRIGGER set_timestamp_categories
          BEFORE UPDATE ON categories
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

    // 3. 인덱스 생성
    console.log("📋 Step 3: Creating indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order)`;
    console.log("✅ Indexes created");

    // 4. 기본 카테고리 데이터 삽입
    console.log("📋 Step 4: Inserting default categories...");
    const categories = [
      ["건강", "운동, 식단, 수면 등 건강 관련 활동", "#4CAF50", "💪", 1],
      ["학습", "독서, 공부, 온라인 강의 등 학습 활동", "#2196F3", "📚", 2],
      ["생활", "청소, 정리, 집안일 등 일상 생활", "#FF9800", "🏠", 3],
      ["취미", "음악, 그림, 게임 등 취미 활동", "#E91E63", "🎨", 4],
      ["인간관계", "가족, 친구, 동료와의 관계 관리", "#9C27B0", "👥", 5],
      ["업무", "직장, 프로젝트, 업무 관련 활동", "#607D8B", "💼", 6],
      ["자기계발", "명상, 일기, 목표 설정 등", "#795548", "🌱", 7],
      ["기타", "분류되지 않은 기타 활동", "#9E9E9E", "📝", 8],
    ];

    for (const [name, description, color, icon, sort_order] of categories) {
      try {
        await sql`
          INSERT INTO categories (name, description, color, icon, sort_order)
          VALUES (${name}, ${description}, ${color}, ${icon}, ${sort_order})
          ON CONFLICT (name) DO NOTHING
        `;
      } catch (error) {
        console.log(`ℹ️  Category ${name} might already exist, skipping`);
      }
    }
    console.log("✅ Default categories inserted");

    // 5. activities 테이블에 category_id 컬럼 추가
    console.log("📋 Step 5: Adding category_id column to activities...");

    // 컬럼 존재 여부 확인 - 테이블명과 컬럼명을 정확히 지정
    const columnExists = await sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'category_id'
    `;

    let categoryColumnAdded = false;
    if (columnExists.rows.length === 0) {
      await sql`ALTER TABLE activities ADD COLUMN category_id INTEGER REFERENCES categories(id)`;
      console.log("✅ category_id column added");
      categoryColumnAdded = true;

      // 6. 기존 category 문자열을 category_id로 매핑
      console.log("📋 Step 6: Mapping existing categories...");

      // 기존 카테고리 문자열들을 ID로 매핑
      await sql`
        UPDATE activities SET category_id = (
          SELECT id FROM categories WHERE name = activities.category
        ) WHERE category IS NOT NULL
      `;

      // 매핑되지 않은 경우 '기타' 카테고리로 설정
      await sql`
        UPDATE activities SET category_id = (
          SELECT id FROM categories WHERE name = '기타'
        ) WHERE category_id IS NULL
      `;

      console.log("✅ Existing categories mapped");
    } else {
      console.log("ℹ️  category_id column already exists, skipping");
    }

    // 7. 인덱스 추가 (컬럼이 존재하는 경우에만)
    console.log("📋 Step 7: Creating activity category index...");
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_activities_category_id ON activities(category_id)`;
      console.log("✅ Activity category index created");
    } catch (indexError) {
      if (indexError.message.includes("does not exist")) {
        console.log(
          "ℹ️  category_id column doesn't exist yet, skipping index creation"
        );
      } else {
        throw indexError;
      }
    }

    // 결과 확인
    console.log("🔍 Verifying categories table creation...");

    const categoriesResult =
      await sql`SELECT COUNT(*) as count FROM categories`;

    // activities 테이블의 category_id 컬럼 확인
    let activitiesWithCategoryId = 0;
    try {
      const activitiesResult = await sql`
        SELECT COUNT(*) as count 
        FROM activities 
        WHERE category_id IS NOT NULL
      `;
      activitiesWithCategoryId = activitiesResult.rows[0].count;
    } catch (queryError) {
      console.log("ℹ️  category_id column not available for counting");
    }

    console.log(
      `📊 Categories table: ${categoriesResult.rows[0].count} categories`
    );
    console.log(
      `📊 Activities with category_id: ${activitiesWithCategoryId} activities`
    );

    // 카테고리 목록 표시
    const categoriesList = await sql`
      SELECT id, name, icon, color 
      FROM categories 
      ORDER BY sort_order
    `;

    console.log("\n📋 Created categories:");
    categoriesList.rows.forEach((cat) => {
      console.log(
        `  ${cat.icon} ${cat.name} (ID: ${cat.id}, Color: ${cat.color})`
      );
    });

    console.log("\n✅ Categories table creation completed successfully!");
    console.log("");
    console.log("📝 Summary:");
    console.log("- Created categories table with predefined categories");
    if (categoryColumnAdded) {
      console.log("- Added category_id column to activities table");
      console.log("- Mapped existing category strings to category IDs");
    }
    console.log("- Set up proper indexes and relationships");
  } catch (error) {
    console.error("❌ Categories table creation failed:", error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  createCategoriesTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = createCategoriesTable;
