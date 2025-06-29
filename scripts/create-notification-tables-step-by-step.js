require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function createNotificationTables() {
  try {
    console.log("🚀 Creating notification system tables step by step...");

    // 1. ENUM 타입 생성
    console.log("📋 Step 1: Creating ENUM types...");

    try {
      await sql`
        CREATE TYPE notification_type AS ENUM (
          'daily_reminder',
          'weekly_reminder',
          'long_inactive',
          'streak_celebration',
          'goal_achievement',
          'encouragement',
          'custom'
        )
      `;
      console.log("✅ notification_type ENUM created");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  notification_type ENUM already exists");
      } else {
        throw error;
      }
    }

    try {
      await sql`
        CREATE TYPE notification_priority AS ENUM (
          'low',
          'normal',
          'high',
          'urgent'
        )
      `;
      console.log("✅ notification_priority ENUM created");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  notification_priority ENUM already exists");
      } else {
        throw error;
      }
    }

    // 2. 사용자 알림 설정 테이블 생성
    console.log("📋 Step 2: Creating user_notification_settings table...");
    await sql`
      CREATE TABLE IF NOT EXISTS user_notification_settings (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) DEFAULT 'default_user',
        daily_reminder_enabled BOOLEAN DEFAULT true,
        daily_reminder_time TIME DEFAULT '23:00:00',
        weekly_reminder_enabled BOOLEAN DEFAULT true,
        weekly_reminder_day INTEGER DEFAULT 5,
        weekly_reminder_time TIME DEFAULT '18:00:00',
        long_inactive_enabled BOOLEAN DEFAULT true,
        long_inactive_days INTEGER DEFAULT 7,
        streak_celebration_enabled BOOLEAN DEFAULT true,
        goal_achievement_enabled BOOLEAN DEFAULT true,
        push_subscription TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✅ user_notification_settings table created");

    // 3. 알림 테이블 생성
    console.log("📋 Step 3: Creating notifications table...");
    await sql`
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
        data JSONB,
        scheduled_at TIMESTAMPTZ NOT NULL,
        sent_at TIMESTAMPTZ,
        read_at TIMESTAMPTZ,
        clicked_at TIMESTAMPTZ,
        is_sent BOOLEAN DEFAULT false,
        is_read BOOLEAN DEFAULT false,
        is_clicked BOOLEAN DEFAULT false,
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✅ notifications table created");

    // 4. 알림 스케줄 테이블 생성
    console.log("📋 Step 4: Creating notification_schedules table...");
    await sql`
      CREATE TABLE IF NOT EXISTS notification_schedules (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
        type notification_type NOT NULL,
        is_active BOOLEAN DEFAULT true,
        cron_expression VARCHAR(255),
        next_run_at TIMESTAMPTZ,
        last_run_at TIMESTAMPTZ,
        conditions JSONB,
        template_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✅ notification_schedules table created");

    // 5. 알림 통계 테이블 생성
    console.log("📋 Step 5: Creating notification_stats table...");
    await sql`
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
      )
    `;
    console.log("✅ notification_stats table created");

    // 6. 트리거 생성
    console.log("📋 Step 6: Creating triggers...");

    try {
      await sql`
        CREATE TRIGGER set_timestamp_user_notification_settings
          BEFORE UPDATE ON user_notification_settings
          FOR EACH ROW
          EXECUTE PROCEDURE trigger_set_timestamp()
      `;
      console.log("✅ user_notification_settings trigger created");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  user_notification_settings trigger already exists");
      } else {
        throw error;
      }
    }

    try {
      await sql`
        CREATE TRIGGER set_timestamp_notification_schedules
          BEFORE UPDATE ON notification_schedules
          FOR EACH ROW
          EXECUTE PROCEDURE trigger_set_timestamp()
      `;
      console.log("✅ notification_schedules trigger created");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  notification_schedules trigger already exists");
      } else {
        throw error;
      }
    }

    // 7. 인덱스 생성
    console.log("📋 Step 7: Creating indexes...");
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_notifications_activity_id ON notifications(activity_id)",
      "CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)",
      "CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at)",
      "CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at)",
      "CREATE INDEX IF NOT EXISTS idx_notifications_is_sent ON notifications(is_sent)",
      "CREATE INDEX IF NOT EXISTS idx_notification_schedules_activity_id ON notification_schedules(activity_id)",
      "CREATE INDEX IF NOT EXISTS idx_notification_schedules_next_run_at ON notification_schedules(next_run_at)",
      "CREATE INDEX IF NOT EXISTS idx_notification_schedules_is_active ON notification_schedules(is_active)",
      "CREATE INDEX IF NOT EXISTS idx_notification_stats_date_type ON notification_stats(date, type)",
    ];

    for (const indexSQL of indexes) {
      await sql.query(indexSQL);
    }
    console.log("✅ All indexes created");

    // 8. 기본 사용자 설정 삽입
    console.log("📋 Step 8: Inserting default user settings...");
    await sql`
      INSERT INTO user_notification_settings (user_id) 
      VALUES ('default_user')
      ON CONFLICT DO NOTHING
    `;
    console.log("✅ Default user settings inserted");

    // 검증
    console.log("🔍 Verifying table creation...");

    const settingsResult =
      await sql`SELECT COUNT(*) as count FROM user_notification_settings`;
    const notificationsResult =
      await sql`SELECT COUNT(*) as count FROM notifications`;
    const schedulesResult =
      await sql`SELECT COUNT(*) as count FROM notification_schedules`;
    const statsResult =
      await sql`SELECT COUNT(*) as count FROM notification_stats`;

    console.log(
      `📊 user_notification_settings: ${settingsResult.rows[0].count} records`
    );
    console.log(
      `📊 notifications: ${notificationsResult.rows[0].count} records`
    );
    console.log(
      `📊 notification_schedules: ${schedulesResult.rows[0].count} records`
    );
    console.log(`📊 notification_stats: ${statsResult.rows[0].count} records`);

    console.log("✅ Notification system tables created successfully!");
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
