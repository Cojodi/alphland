/**
 * Initialize local SQLite database with Better Auth schema
 */
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "dev.db");
const migrationPath = path.join(
  __dirname,
  "..",
  "migrations",
  "001_initial_schema_fixed.sql"
);

console.log("Initializing local database...");
console.log("Database path:", dbPath);

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
  console.log("Removing existing database...");
  fs.unlinkSync(dbPath);
}

// Create new database
const db = new Database(dbPath);

// Read and execute migration
const migration = fs.readFileSync(migrationPath, "utf-8");

console.log("Running migrations...");

// Execute entire migration at once
try {
  db.exec(migration);
  console.log("✓ Migration executed successfully");
} catch (error) {
  console.error("✗ Migration failed:", error.message);
  process.exit(1);
}

console.log(`\nMigration complete!`);

// Verify tables were created
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all();

console.log("\nCreated tables:");
tables.forEach((table) => {
  console.log(`  - ${table.name}`);
});

db.close();
console.log("\n✓ Database initialized successfully!");
