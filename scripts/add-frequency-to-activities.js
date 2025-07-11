const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function addFrequencyToActivities() {
  try {
    console.log('🚀 Adding frequency functionality to activities table...');

    // 1. 활동 주기 타입 ENUM 생성
    try {
      await sql`CREATE TYPE frequency_type AS ENUM ('preset', 'custom')`;
      console.log('✅ Created frequency_type ENUM');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  frequency_type ENUM already exists');
      } else {
        throw error;
      }
    }

    // 2. 활동 주기 단위 ENUM 생성
    try {
      await sql`CREATE TYPE frequency_unit AS ENUM ('days', 'weeks', 'months', 'quarters', 'years')`;
      console.log('✅ Created frequency_unit ENUM');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  frequency_unit ENUM already exists');
      } else {
        throw error;
      }
    }

    // 3. activities 테이블에 frequency_type 컬럼 추가
    try {
      await sql`ALTER TABLE activities ADD COLUMN frequency_type frequency_type DEFAULT 'preset'`;
      console.log('✅ Added frequency_type column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  frequency_type column already exists');
      } else {
        throw error;
      }
    }

    // 4. activities 테이블에 frequency_value 컬럼 추가
    try {
      await sql`ALTER TABLE activities ADD COLUMN frequency_value INTEGER DEFAULT 1`;
      console.log('✅ Added frequency_value column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  frequency_value column already exists');
      } else {
        throw error;
      }
    }

    // 5. activities 테이블에 frequency_unit 컬럼 추가
    try {
      await sql`ALTER TABLE activities ADD COLUMN frequency_unit frequency_unit DEFAULT 'days'`;
      console.log('✅ Added frequency_unit column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  frequency_unit column already exists');
      } else {
        throw error;
      }
    }

    // 6. 기존 데이터에 기본값 설정
    try {
      const updateResult = await sql`
        UPDATE activities 
        SET 
            frequency_type = 'preset',
            frequency_value = 1,
            frequency_unit = 'days'
        WHERE frequency_type IS NULL
      `;
      console.log(
        `✅ Updated ${updateResult.rowCount} existing activities with default frequency values`,
      );
    } catch (error) {
      console.error('❌ Error updating existing activities:', error);
      throw error;
    }

    // 7. 인덱스 생성 (성능 최적화)
    const indexes = [
      { name: 'idx_activities_frequency_type', column: 'frequency_type' },
      { name: 'idx_activities_frequency_value', column: 'frequency_value' },
      { name: 'idx_activities_frequency_unit', column: 'frequency_unit' },
    ];

    for (const index of indexes) {
      try {
        await sql.query(
          `CREATE INDEX IF NOT EXISTS ${index.name} ON activities(${index.column})`,
        );
        console.log(`✅ Created index: ${index.name}`);
      } catch (error) {
        console.error(`❌ Error creating index ${index.name}:`, error);
        // 인덱스 생성 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // 8. 복합 인덱스 생성
    try {
      await sql.query(
        `CREATE INDEX IF NOT EXISTS idx_activities_frequency_composite ON activities(frequency_type, frequency_value, frequency_unit)`,
      );
      console.log('✅ Created composite frequency index');
    } catch (error) {
      console.error('❌ Error creating composite index:', error);
      // 인덱스 생성 실패는 치명적이지 않으므로 계속 진행
    }

    // 마이그레이션 검증
    console.log('🔍 Verifying migration...');

    // activities 테이블의 새로운 컬럼 확인
    const columnsResult = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'activities' 
        AND column_name IN ('frequency_type', 'frequency_value', 'frequency_unit')
      ORDER BY column_name
    `;

    console.log('📊 New columns in activities table:');
    columnsResult.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`,
      );
    });

    // 기존 데이터 확인
    const activitiesResult = await sql`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN frequency_type IS NOT NULL THEN 1 END) as with_frequency
      FROM activities
    `;

    console.log(
      `📊 Activities table: ${activitiesResult.rows[0].total} total records`,
    );
    console.log(
      `📊 Activities with frequency: ${activitiesResult.rows[0].with_frequency} records`,
    );

    console.log('✅ Frequency migration completed successfully!');
    console.log('');
    console.log('📝 Migration Summary:');
    console.log(
      '- Added frequency_type, frequency_value, frequency_unit columns',
    );
    console.log('- Created frequency_type and frequency_unit ENUMs');
    console.log('- Set default values for existing activities');
    console.log('- Created performance indexes');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행된 경우에만 실행
if (require.main === module) {
  addFrequencyToActivities();
}

module.exports = { addFrequencyToActivities };
