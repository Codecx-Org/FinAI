const assert = require('assert');

function formatMpesaPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  }
  return cleaned;
}

try {
  // Test local formatting
  assert.strictEqual(formatMpesaPhoneNumber("0712345678"), "254712345678");
  assert.strictEqual(formatMpesaPhoneNumber("254712345678"), "254712345678");
  assert.strictEqual(formatMpesaPhoneNumber("+254 712 345 678"), "254712345678");
  assert.strictEqual(formatMpesaPhoneNumber("0112345678"), "254112345678");
  
  console.log("✓ Mobile format integration tests passed successfully!");
} catch (err) {
  console.error("Test failed:", err);
  process.exit(1);
}
