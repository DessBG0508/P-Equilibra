import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, ".output");
const publicDir = path.join(outputDir, "public");
const distDir = path.join(rootDir, "dist");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  fs.mkdirSync(distDir, { recursive: true });

  if (fs.existsSync(publicDir)) {
    copyRecursive(publicDir, distDir);
  }

  // Also copy .output into dist/.output so full server artifacts are bundled
  if (fs.existsSync(outputDir)) {
    copyRecursive(outputDir, path.join(distDir, ".output"));
  }

  // Find css and js entry files in dist/assets
  const assetsDir = path.join(distDir, "assets");
  let cssFile = "";
  let jsFile = "";

  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    cssFile = assetFiles.find((f) => f.startsWith("styles-") && f.endsWith(".css")) || "";
    jsFile = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js")) || "";
  }

  const indexHtmlPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexHtmlPath)) {
    const htmlContent = `<!DOCTYPE html>
<html lang="es-MX">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Equilibra TESH — Tu bienestar universitario</title>
    <meta name="author" content="Equilibra TESH" />
    <meta name="description" content="Espacio de apoyo psicológico y bienestar emocional para la comunidad estudiantil del TESH Huixquilucan." />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" />
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ""}
    <script>
      (function(){try{var t=localStorage.getItem("equilibra_theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();
    </script>
  </head>
  <body>
    <div id="root"></div>
    ${jsFile ? `<script type="module" src="/assets/${jsFile}"></script>` : ""}
  </body>
</html>
`;
    fs.writeFileSync(indexHtmlPath, htmlContent, "utf-8");
  }

  // Also ensure .output/public has index.html
  if (fs.existsSync(publicDir) && !fs.existsSync(path.join(publicDir, "index.html"))) {
    fs.copyFileSync(indexHtmlPath, path.join(publicDir, "index.html"));
  }

  console.log("Successfully prepared dist/ build artifacts.");
} catch (err) {
  console.error("Error preparing dist directory:", err);
  process.exit(1);
}
