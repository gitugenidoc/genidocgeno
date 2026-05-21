#!/usr/bin/env node

/**
 * 🔒 SECURITY TEST SUITE - Tests de Sécurité GenidoC
 *
 * Exécute une série de tests pour vérifier les protections de sécurité
 *
 * Usage: npm run test:security
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Colors for console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Test results
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

/**
 * Print colored output
 */
function print(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(options) {
  return new Promise((resolve) => {
    const protocol = options.protocol === "https:" ? https : http;
    const req = protocol.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        statusCode: 0,
        headers: {},
        error: err.message,
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Test result logger
 */
function testResult(name, passed, message) {
  if (passed) {
    print("green", `✅ ${name}: ${message}`);
    testsPassed++;
  } else {
    print("red", `❌ ${name}: ${message}`);
    testsFailed++;
  }
  testResults.push({ name, passed, message });
}

/**
 * Main test suite
 */
async function runTests() {
  const host = process.env.TEST_HOST || "localhost";
  const port = process.env.TEST_PORT || 5000;
  const protocol = process.env.TEST_PROTOCOL || "http:";

  print("cyan", "\n╔════════════════════════════════════════╗");
  print("cyan", "║  🔒 SECURITY TEST SUITE - GenidoC     ║");
  print("cyan", "╚════════════════════════════════════════╝\n");

  // ========================
  // File Access Tests
  // ========================
  print("blue", "\n📄 FILE ACCESS PROTECTION TESTS");
  print("blue", "═".repeat(50));

  const sensitiveFiles = [
    "/.env",
    "/.env.local",
    "/package.json",
    "/package-lock.json",
    "/backend/server.js",
    "/backend/config/security.js",
    "/gradlew",
    "/build.gradle",
  ];

  for (const file of sensitiveFiles) {
    const response = await makeRequest({
      hostname: host,
      port: port,
      path: file,
      method: "GET",
      protocol,
    });

    testResult(
      `File Access: ${file}`,
      response.statusCode === 403 || response.statusCode === 404,
      response.statusCode === 403 ? "✓ Forbidden" : "✓ Not Found",
    );
  }

  // ========================
  // HTML Direct Access Tests
  // ========================
  print("blue", "\n📄 HTML PROTECTION TESTS");
  print("blue", "═".repeat(50));

  const htmlFiles = ["/index.html", "/auth.html", "/doctor-dashboard.html"];

  for (const html of htmlFiles) {
    const response = await makeRequest({
      hostname: host,
      port: port,
      path: html,
      method: "GET",
      protocol,
    });

    testResult(
      `Direct HTML Access: ${html}`,
      response.statusCode === 404,
      "✓ Blocked",
    );
  }

  // ========================
  // Security Headers Tests
  // ========================
  print("blue", "\n🛡️  SECURITY HEADERS TESTS");
  print("blue", "═".repeat(50));

  const headerTests = [
    {
      header: "x-content-type-options",
      expected: "nosniff",
      name: "X-Content-Type-Options",
    },
    {
      header: "x-frame-options",
      expected: "DENY",
      name: "X-Frame-Options",
    },
    {
      header: "x-xss-protection",
      expected: "1",
      name: "X-XSS-Protection",
    },
    {
      header: "strict-transport-security",
      expected: "max-age",
      name: "HSTS",
    },
    {
      header: "referrer-policy",
      expected: "strict-origin-when-cross-origin",
      name: "Referrer-Policy",
    },
  ];

  const response = await makeRequest({
    hostname: host,
    port: port,
    path: "/api/health",
    method: "GET",
    protocol,
  });

  for (const test of headerTests) {
    const headerValue = response.headers[test.header];
    const passed = headerValue && headerValue.includes(test.expected);
    testResult(
      `Header: ${test.name}`,
      passed,
      passed ? `✓ ${headerValue}` : "✗ Missing",
    );
  }

  // ========================
  // Rate Limiting Tests
  // ========================
  print("blue", "\n⏱️  RATE LIMITING TESTS");
  print("blue", "═".repeat(50));

  const rateTestCount = 150;
  let rateLimitHit = false;

  for (let i = 0; i < rateTestCount; i++) {
    const resp = await makeRequest({
      hostname: host,
      port: port,
      path: "/api/health",
      method: "GET",
      protocol,
    });

    if (resp.statusCode === 429) {
      rateLimitHit = true;
      break;
    }
  }

  testResult(
    "Rate Limiting",
    rateLimitHit,
    `✓ Triggered after ${rateTestCount} requests`,
  );

  // ========================
  // XSS Protection Tests
  // ========================
  print("blue", "\n⚠️  XSS ATTACK TESTS");
  print("blue", "═".repeat(50));

  const xssPayloads = [
    "<script>alert(1)</script>",
    '"><script>alert(1)</script>',
    "javascript:alert(1)",
    "onerror=alert(1)",
    'onclick="alert(1)"',
  ];

  for (const payload of xssPayloads) {
    const response = await makeRequest({
      hostname: host,
      port: port,
      path: `/api/students?search=${encodeURIComponent(payload)}`,
      method: "GET",
      protocol,
    });

    const sanitized = !response.body.includes(payload);
    testResult(
      `XSS Protection: ${payload.substring(0, 20)}...`,
      sanitized,
      "✓ Payload sanitized",
    );
  }

  // ========================
  // CORS Tests
  // ========================
  print("blue", "\n🔒 CORS TESTS");
  print("blue", "═".repeat(50));

  const corsTests = [
    {
      origin: "https://app.genidoc.local",
      expectAllow: true,
      name: "Allowed Origin",
    },
    {
      origin: "https://evil.com",
      expectAllow: false,
      name: "Blocked Origin",
    },
  ];

  for (const test of corsTests) {
    const response = await makeRequest({
      hostname: host,
      port: port,
      path: "/api/health",
      method: "OPTIONS",
      headers: {
        Origin: test.origin,
        "Access-Control-Request-Method": "POST",
      },
      protocol,
    });

    const allowed =
      response.headers["access-control-allow-origin"] === test.origin;
    testResult(
      `CORS: ${test.name}`,
      allowed === test.expectAllow,
      allowed ? "✓ Allowed" : "✓ Blocked",
    );
  }

  // ========================
  // SQL Injection Tests
  // ========================
  print("blue", "\n🚨 SQL INJECTION TESTS");
  print("blue", "═".repeat(50));

  const sqlPayloads = [
    "'; DROP TABLE students; --",
    "1' OR '1'='1",
    "1' UNION SELECT * FROM users--",
  ];

  for (const payload of sqlPayloads) {
    const response = await makeRequest({
      hostname: host,
      port: port,
      path: `/api/students?id=${encodeURIComponent(payload)}`,
      method: "GET",
      protocol,
    });

    // Doit pas retourner d'erreur de syntaxe SQL
    const safe =
      !response.body.includes("syntax") && !response.body.includes("SQL");
    testResult(
      `SQL Injection: ${payload.substring(0, 20)}...`,
      safe,
      "✓ Query parameterized",
    );
  }

  // ========================
  // Directory Traversal Tests
  // ========================
  print("blue", "\n📂 DIRECTORY TRAVERSAL TESTS");
  print("blue", "═".repeat(50));

  const traversalPayloads = [
    "/../.env",
    "/../../.env",
    "/..\\..\\..\\windows\\system32",
    "%2e%2e%2f.env",
  ];

  for (const payload of traversalPayloads) {
    const response = await makeRequest({
      hostname: host,
      port: port,
      path: `/api/files${payload}`,
      method: "GET",
      protocol,
    });

    const protected_ =
      response.statusCode === 403 || response.statusCode === 404;
    testResult(`Directory Traversal: ${payload}`, protected_, "✓ Blocked");
  }

  // ========================
  // Environment Variables Check
  // ========================
  print("blue", "\n🔐 ENVIRONMENT VARIABLES CHECK");
  print("blue", "═".repeat(50));

  const envFile = path.join(__dirname, ".env");
  const envExists = fs.existsSync(envFile);

  if (envExists) {
    const envContent = fs.readFileSync(envFile, "utf8");

    testResult(".env exists", true, "✓ Configuration file found");

    const checks = [
      {
        name: "JWT_SECRET set",
        regex: /JWT_SECRET=.{32,}/,
      },
      {
        name: "SESSION_SECRET set",
        regex: /SESSION_SECRET=.{32,}/,
      },
      {
        name: "NODE_ENV set to production",
        regex: /NODE_ENV=production/,
      },
    ];

    for (const check of checks) {
      const passed = check.regex.test(envContent);
      testResult(
        check.name,
        passed,
        passed ? "✓ Configured" : "✗ Missing or too short",
      );
    }
  }

  // ========================
  // NPM Audit Check
  // ========================
  print("blue", "\n📦 DEPENDENCY AUDIT");
  print("blue", "═".repeat(50));

  exec("npm audit --json", (error, stdout) => {
    try {
      const audit = JSON.parse(stdout);
      const vulnerabilities = audit.metadata?.vulnerabilities || {};
      const highSev =
        (vulnerabilities.high || 0) + (vulnerabilities.critical || 0);

      testResult("NPM Audit", highSev === 0, `✓ No critical vulnerabilities`);
    } catch (err) {
      testResult("NPM Audit", false, "✗ Could not run npm audit");
    }

    // Print summary
    printSummary();
  });
}

/**
 * Print test summary
 */
function printSummary() {
  print("cyan", "\n╔════════════════════════════════════════╗");
  print("cyan", "║  TEST SUMMARY                          ║");
  print("cyan", "╚════════════════════════════════════════╝\n");

  print("cyan", `Total Tests: ${testsPassed + testsFailed}`);
  print("green", `Passed: ${testsPassed}`);
  if (testsFailed > 0) {
    print("red", `Failed: ${testsFailed}`);
  }

  const percentage = (
    (testsPassed / (testsPassed + testsFailed)) *
    100
  ).toFixed(1);
  print("cyan", `Success Rate: ${percentage}%\n`);

  if (testsFailed === 0) {
    print("green", "✅ ALL SECURITY TESTS PASSED! 🎉\n");
    process.exit(0);
  } else {
    print("red", "⚠️  Some security tests failed. Review above.\n");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  print("red", `Fatal error: ${error.message}`);
  process.exit(1);
});
