const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
const files = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

console.log(
  "# Run these migration files IN ORDER on your DEV Supabase project",
  "(SQL Editor → New query, or supabase db push):\n",
);

for (const file of files) {
  console.log(`-- ===== ${file} =====`);
  console.log(fs.readFileSync(path.join(migrationsDir, file), "utf8").trim());
  console.log("\n");
}
