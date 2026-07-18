/* ONE-TIME migration: copies+optimizes the original messy export folders
   ("Organic Static Fb:Instagram Posts", "Paid Meta Ads Campaign") into
   clean assets/organic-posts/ and assets/paid-ads/ folders that
   scripts/gen-social.js can read going forward. Loose files become
   static posts; subfolders become carousels (renumbered 1..n by
   original filename order). Run once: node scripts/import-social-once.js
   Originals are left untouched on disk (just excluded from git). */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const IMG = /\.(jpe?g|png|webp)$/i;
const byName = (a, b) => a.localeCompare(b, undefined, { numeric: true });

function slug(name) {
  return name
    .replace(/\.(jpe?g|png|webp)$/i, "")
    .replace(/["""]/g, "")
    .replace(/\((static|carousel|story)\)/gi, "")
    .replace(/[_]+/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60) || "post";
}

function convert(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  execSync(`sips -s format jpeg -s formatOptions 78 --resampleWidth 1200 "${src}" --out "${dest}"`, { stdio: "ignore" });
}

function migrate(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  const looseFiles = entries.filter((e) => e.isFile() && IMG.test(e.name)).map((e) => e.name).sort(byName);
  const carouselDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort(byName);

  let n = 0;
  for (const f of looseFiles) {
    n++;
    const s = slug(f);
    convert(path.join(srcDir, f), path.join(destDir, `static-${n}-${s}.jpg`));
  }

  let c = 0;
  for (const dir of carouselDirs) {
    c++;
    const carSlug = slug(dir);
    const files = fs
      .readdirSync(path.join(srcDir, dir))
      .filter((f) => IMG.test(f))
      .sort(byName);
    files.forEach((f, i) => {
      convert(path.join(srcDir, dir, f), path.join(destDir, `carousel-${c}-${carSlug}-${i + 1}.jpg`));
    });
    console.log(`  carousel "${dir}" -> carousel-${c}-${carSlug}- (${files.length} images)`);
  }
  console.log(`${srcDir} -> ${destDir}: ${looseFiles.length} static, ${carouselDirs.length} carousels`);
}

migrate(path.join(ROOT, "assets", "Organic Static Fb:Instagram Posts"), path.join(ROOT, "assets", "organic-posts"));
migrate(path.join(ROOT, "assets", "Paid Meta Ads Campaign"), path.join(ROOT, "assets", "paid-ads"));
console.log("Done. Now run: node scripts/gen-social.js");
