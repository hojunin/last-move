const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

function generateVapidKeys() {
  console.log("🔑 Generating VAPID keys...");

  // VAPID 키 쌍 생성
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log("\n✅ VAPID keys generated successfully!\n");

  console.log("📋 Add these to your .env.local file:");
  console.log("=====================================");
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log("");

  // .env.local 파일에 자동으로 추가 (기존 내용 유지)
  const envPath = path.join(__dirname, "..", ".env.local");
  let envContent = "";

  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
      console.log("📁 Found existing .env.local file");
    }
  } catch (error) {
    console.log("📁 Creating new .env.local file");
  }

  // VAPID 키가 이미 있는지 확인
  const hasVapidPublic = envContent.includes("VAPID_PUBLIC_KEY=");
  const hasVapidPrivate = envContent.includes("VAPID_PRIVATE_KEY=");
  const hasNextPublicVapid = envContent.includes(
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY="
  );

  if (hasVapidPublic || hasVapidPrivate || hasNextPublicVapid) {
    console.log("⚠️  VAPID keys already exist in .env.local");
    console.log("   If you want to replace them, please do it manually.");
    return;
  }

  // VAPID 키 추가
  const vapidSection = `
# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
`;

  const updatedContent = envContent + vapidSection;

  try {
    fs.writeFileSync(envPath, updatedContent);
    console.log("✅ VAPID keys added to .env.local file");
  } catch (error) {
    console.error("❌ Failed to write to .env.local:", error.message);
    console.log(
      "\n📝 Please manually add the keys above to your .env.local file"
    );
  }

  console.log("\n🚀 Next steps:");
  console.log("1. Restart your development server");
  console.log("2. Test push notifications in your app");
  console.log(
    "3. For production, add these keys to your deployment environment variables"
  );

  console.log("\n💡 Important notes:");
  console.log("- Keep your VAPID_PRIVATE_KEY secret and secure");
  console.log("- The public key can be safely exposed to clients");
  console.log("- These keys identify your application to push services");
}

// 스크립트 실행
if (require.main === module) {
  generateVapidKeys();
}

module.exports = { generateVapidKeys };
