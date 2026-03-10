const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const standalonePath = path.join(projectRoot, ".next", "standalone");
const outputPath = path.join(projectRoot, "electron-server");

// Clean output directory
if (fs.existsSync(outputPath)) {
  fs.rmSync(outputPath, { recursive: true });
}

// Copy standalone server
console.log("Copying standalone server...");
copyDirSync(standalonePath, outputPath);

// Copy static files
const staticSrc = path.join(projectRoot, ".next", "static");
const staticDest = path.join(outputPath, ".next", "static");
if (fs.existsSync(staticSrc)) {
  console.log("Copying static files...");
  copyDirSync(staticSrc, staticDest);
}

// Copy public files
const publicSrc = path.join(projectRoot, "public");
const publicDest = path.join(outputPath, "public");
if (fs.existsSync(publicSrc)) {
  console.log("Copying public files...");
  copyDirSync(publicSrc, publicDest);
}

// Copy database
const dbSrc = path.join(projectRoot, "dev.db");
const dbDest = path.join(outputPath, "dev.db");
if (fs.existsSync(dbSrc)) {
  console.log("Copying database...");
  fs.copyFileSync(dbSrc, dbDest);
}

console.log("Electron server prepared successfully!");

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (entry.isFile()) {
      // Skip sockets, pipes, and other special files
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (e) {
        if (e.code === "ENOTSUP") {
          console.log(`  Skipping special file: ${entry.name}`);
        } else {
          throw e;
        }
      }
    }
  }
}
