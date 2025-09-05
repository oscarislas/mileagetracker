package testutils

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// TestDB provides a thread-safe in-memory SQLite database for testing
type TestDB struct {
	db       *gorm.DB
	mutex    sync.Mutex
	closed   bool
	migrated bool
}

// SetupTestDB creates and returns a new in-memory SQLite database for testing.
// Each call creates a fresh database to ensure test isolation.
// The database is automatically migrated with all domain entities.
func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	// Create unique database name for this test using temp directory
	// This prevents :memory: files from cluttering the project directory
	tempDir := t.TempDir()
	dbName := "file:" + tempDir + "/test.db?mode=memory&cache=shared"

	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		// Ensure foreign keys are enabled for referential integrity
		DisableForeignKeyConstraintWhenMigrating: false,
	})
	assert.NoError(t, err, "failed to create test database")

	// Enable foreign key constraints for SQLite
	err = db.Exec("PRAGMA foreign_keys = ON").Error
	assert.NoError(t, err, "failed to enable foreign key constraints")

	// Auto-migrate all domain entities
	err = db.AutoMigrate(
		&domain.Trip{},
		&domain.Client{},
		&domain.Settings{},
	)
	assert.NoError(t, err, "failed to migrate test database schema")

	// Register cleanup function
	t.Cleanup(func() {
		CleanupTestDB(t, db)
	})

	return db
}

// SetupTestDBWithSchema creates a test database and applies custom schema migrations.
// This is useful for tests that need specific database schema configurations.
func SetupTestDBWithSchema(t *testing.T, migrations ...func(*gorm.DB) error) *gorm.DB {
	t.Helper()

	db := SetupTestDB(t)

	// Apply custom migrations
	for i, migration := range migrations {
		err := migration(db)
		assert.NoError(t, err, "failed to apply custom migration %d", i)
	}

	return db
}

// SetupTestDBWithData creates a test database and populates it with initial data.
// This is useful for tests that need pre-populated data.
func SetupTestDBWithData(t *testing.T, dataFn func(*gorm.DB) error) *gorm.DB {
	t.Helper()

	db := SetupTestDB(t)

	// Populate with test data
	err := dataFn(db)
	assert.NoError(t, err, "failed to populate test database with initial data")

	return db
}

// CleanupTestDB properly closes and cleans up a test database.
// This is automatically called when using SetupTestDB via t.Cleanup().
func CleanupTestDB(t *testing.T, db *gorm.DB) {
	t.Helper()

	if db == nil {
		return
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Logf("failed to get underlying sql.DB for cleanup: %v", err)
		return
	}

	err = sqlDB.Close()
	if err != nil {
		t.Logf("failed to close test database: %v", err)
	}
}

// TruncateTables clears all data from the specified tables while preserving schema.
// This is useful for cleaning up between test cases while reusing the same database.
func TruncateTables(t *testing.T, db *gorm.DB, tables ...string) {
	t.Helper()

	// If no tables specified, truncate all known tables
	if len(tables) == 0 {
		tables = []string{"trips", "clients", "settings"}
	}

	// Disable foreign key checks during truncation
	err := db.Exec("PRAGMA foreign_keys = OFF").Error
	assert.NoError(t, err, "failed to disable foreign key constraints")

	// Truncate each table
	for _, table := range tables {
		err := db.Exec(fmt.Sprintf("DELETE FROM %s", table)).Error
		assert.NoError(t, err, "failed to truncate table %s", table)

		// Reset auto-increment counters
		err = db.Exec(fmt.Sprintf("DELETE FROM sqlite_sequence WHERE name='%s'", table)).Error
		// Ignore error if table doesn't use auto-increment
		if err != nil {
			t.Logf("note: could not reset auto-increment for table %s (this may be normal): %v", table, err)
		}
	}

	// Re-enable foreign key checks
	err = db.Exec("PRAGMA foreign_keys = ON").Error
	assert.NoError(t, err, "failed to re-enable foreign key constraints")
}

// WithTransaction runs a function within a database transaction and rolls it back afterwards.
// This is useful for tests that need to isolate database changes.
func WithTransaction(t *testing.T, db *gorm.DB, fn func(*gorm.DB) error) {
	t.Helper()

	tx := db.Begin()
	assert.NoError(t, tx.Error, "failed to begin transaction")

	defer func() {
		err := tx.Rollback().Error
		if err != nil && err != gorm.ErrInvalidTransaction {
			t.Logf("failed to rollback transaction: %v", err)
		}
	}()

	err := fn(tx)
	assert.NoError(t, err, "test function failed within transaction")
}

// AssertTableExists verifies that a table exists in the database.
func AssertTableExists(t *testing.T, db *gorm.DB, tableName string) {
	t.Helper()

	var count int64
	err := db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", tableName).Scan(&count).Error
	assert.NoError(t, err, "failed to query for table existence")
	assert.Equal(t, int64(1), count, "table %s should exist", tableName)
}

// AssertTableEmpty verifies that a table contains no records.
func AssertTableEmpty(t *testing.T, db *gorm.DB, tableName string) {
	t.Helper()

	var count int64
	err := db.Raw(fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)).Scan(&count).Error
	assert.NoError(t, err, "failed to count records in table %s", tableName)
	assert.Equal(t, int64(0), count, "table %s should be empty", tableName)
}

// AssertRecordCount verifies the number of records in a table.
func AssertRecordCount(t *testing.T, db *gorm.DB, tableName string, expectedCount int64) {
	t.Helper()

	var count int64
	err := db.Raw(fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)).Scan(&count).Error
	assert.NoError(t, err, "failed to count records in table %s", tableName)
	assert.Equal(t, expectedCount, count, "table %s should have %d records", tableName, expectedCount)
}

// CreateTestContext creates a context with a reasonable timeout for tests.
func CreateTestContext(t *testing.T) context.Context {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	t.Cleanup(cancel)

	return ctx
}

// TestDBConfig holds configuration for advanced test database setups.
type TestDBConfig struct {
	// EnableForeignKeys controls whether foreign key constraints are enabled
	EnableForeignKeys bool
	// LogLevel controls the GORM log level (default: Silent)
	LogLevel logger.LogLevel
	// CustomMigrations are additional migrations to run after auto-migrate
	CustomMigrations []func(*gorm.DB) error
	// InitialData is a function to populate the database with test data
	InitialData func(*gorm.DB) error
}

// SetupTestDBWithConfig creates a test database with custom configuration.
func SetupTestDBWithConfig(t *testing.T, config TestDBConfig) *gorm.DB {
	t.Helper()

	// Create unique database name using temp directory
	tempDir := t.TempDir()
	dbName := "file:" + tempDir + "/test.db?mode=memory&cache=shared"

	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger:                                   logger.Default.LogMode(config.LogLevel),
		DisableForeignKeyConstraintWhenMigrating: !config.EnableForeignKeys,
	})
	assert.NoError(t, err, "failed to create test database")

	// Configure foreign keys
	if config.EnableForeignKeys {
		err = db.Exec("PRAGMA foreign_keys = ON").Error
		assert.NoError(t, err, "failed to enable foreign key constraints")
	}

	// Auto-migrate domain entities
	err = db.AutoMigrate(
		&domain.Trip{},
		&domain.Client{},
		&domain.Settings{},
	)
	assert.NoError(t, err, "failed to migrate test database schema")

	// Apply custom migrations
	for i, migration := range config.CustomMigrations {
		err := migration(db)
		assert.NoError(t, err, "failed to apply custom migration %d", i)
	}

	// Populate with initial data
	if config.InitialData != nil {
		err := config.InitialData(db)
		assert.NoError(t, err, "failed to populate test database with initial data")
	}

	// Register cleanup function
	t.Cleanup(func() {
		CleanupTestDB(t, db)
	})

	return db
}
