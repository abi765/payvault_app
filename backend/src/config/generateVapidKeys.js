/**
 * Generate VAPID keys for web push notifications
 * Run this script once: npm run generate-vapid
 */

const webpush = require('web-push');

console.log('\n🔑 Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_EMAIL=mailto:your-email@example.com\n');
console.log('⚠️  Keep the private key secret! Do not commit it to version control.\n');
