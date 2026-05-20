const fs = require("fs/promises");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "mobile-www");

const files = [
  "index.html",
  "auth.html",
  "doctor-auth.html",
  "doctor-dashboard.html",
  "emergency.html",
  "error-404.html",
  "f.html",
  "forgot-password.html",
  "onboarding.html",
  "profile.html",
  "image.png",
  "mobile-config.js",
  "manifest.webmanifest",
];

const dirs = ["app", "assets", "frontend"];

async function removeIfExists(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(outDir, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  if (relativePath.endsWith(".html")) {
    const html = await fs.readFile(source, "utf8");
    const mobileHead = [
      '<script src="/mobile-config.js"></script>',
      '<link rel="manifest" href="/manifest.webmanifest" />',
      '<meta name="theme-color" content="#123b64" />',
      '<meta name="apple-mobile-web-app-capable" content="yes" />',
      '<meta name="apple-mobile-web-app-title" content="GeniDoc Hayat" />',
    ].join("\n    ");
    await fs.writeFile(destination, html.replace("</head>", `    ${mobileHead}\n  </head>`));
    return;
  }
  await fs.copyFile(source, destination);
}

async function copyDir(relativePath) {
  await fs.cp(path.join(root, relativePath), path.join(outDir, relativePath), {
    recursive: true,
    filter(source) {
      return !source.includes(`${path.sep}.`);
    },
  });
}

async function main() {
  await removeIfExists(outDir);
  await fs.mkdir(outDir, { recursive: true });
  for (const dir of dirs) await copyDir(dir);
  for (const file of files) await copyFile(file);
  console.log(`Mobile assets synced to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
