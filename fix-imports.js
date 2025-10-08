import fs from "fs";
import path from "path";

const rootDir = "./src";

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // Corrige importações antigas
  content = content
    .replace(/import\s*\{\s*dataService\s*\}\s*from/g, "import dataService from")
    .replace(/import\s*\{\s*SystemStatus\s*\}\s*from/g, "import SystemStatus from")
    .replace(/import\s*\{\s*PersistentNotifications\s*\}\s*from/g, "import PersistentNotifications from");

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Corrigido: ${filePath}`);
  }
}

function walkDir(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith(".jsx") || file.endsWith(".js")) {
      fixImportsInFile(fullPath);
    }
  }
}

walkDir(rootDir);
console.log("\n🚀 Todas as importações foram corrigidas com sucesso!");
