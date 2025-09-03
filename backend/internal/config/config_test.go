package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad(t *testing.T) {
	t.Run("should load with default values", func(t *testing.T) {
		// Clear environment variables to ensure defaults
		clearEnvVars()

		config := Load()

		// Database defaults
		assert.Equal(t, "localhost", config.Database.Host)
		assert.Equal(t, 5432, config.Database.Port)
		assert.Equal(t, "postgres", config.Database.User)
		assert.Equal(t, "postgres", config.Database.Password)
		assert.Equal(t, "mileagetracker", config.Database.Name)
		assert.Equal(t, "disable", config.Database.SSLMode)

		// Server defaults
		assert.Equal(t, 8080, config.Server.Port)
		assert.Equal(t, "debug", config.Server.Mode)

		// Logger defaults
		assert.Equal(t, "debug", config.Logger.Level)
	})

	t.Run("should load with environment variables", func(t *testing.T) {
		// Set environment variables
		os.Setenv("DB_HOST", "test-host")
		os.Setenv("DB_PORT", "3306")
		os.Setenv("DB_USER", "test-user")
		os.Setenv("DB_PASSWORD", "test-pass")
		os.Setenv("DB_NAME", "test-db")
		os.Setenv("DB_SSLMODE", "require")
		os.Setenv("SERVER_PORT", "9000")
		os.Setenv("GIN_MODE", "release")
		os.Setenv("LOG_LEVEL", "info")

		config := Load()

		// Database from env
		assert.Equal(t, "test-host", config.Database.Host)
		assert.Equal(t, 3306, config.Database.Port)
		assert.Equal(t, "test-user", config.Database.User)
		assert.Equal(t, "test-pass", config.Database.Password)
		assert.Equal(t, "test-db", config.Database.Name)
		assert.Equal(t, "require", config.Database.SSLMode)

		// Server from env
		assert.Equal(t, 9000, config.Server.Port)
		assert.Equal(t, "release", config.Server.Mode)

		// Logger from env
		assert.Equal(t, "info", config.Logger.Level)

		// Clean up
		clearEnvVars()
	})
}

func TestGetEnv(t *testing.T) {
	t.Run("should return environment variable value", func(t *testing.T) {
		os.Setenv("TEST_KEY", "test-value")

		result := getEnv("TEST_KEY", "default")

		assert.Equal(t, "test-value", result)
		os.Unsetenv("TEST_KEY")
	})

	t.Run("should return default when environment variable is empty", func(t *testing.T) {
		os.Unsetenv("TEST_KEY")

		result := getEnv("TEST_KEY", "default")

		assert.Equal(t, "default", result)
	})

	t.Run("should return default when environment variable is set to empty string", func(t *testing.T) {
		os.Setenv("TEST_KEY", "")

		result := getEnv("TEST_KEY", "default")

		assert.Equal(t, "default", result)
		os.Unsetenv("TEST_KEY")
	})
}

func TestGetEnvAsInt(t *testing.T) {
	t.Run("should return parsed integer from environment variable", func(t *testing.T) {
		os.Setenv("TEST_INT", "1234")

		result := getEnvAsInt("TEST_INT", 5678)

		assert.Equal(t, 1234, result)
		os.Unsetenv("TEST_INT")
	})

	t.Run("should return default when environment variable is not set", func(t *testing.T) {
		os.Unsetenv("TEST_INT")

		result := getEnvAsInt("TEST_INT", 5678)

		assert.Equal(t, 5678, result)
	})

	t.Run("should return default when environment variable is not a valid integer", func(t *testing.T) {
		os.Setenv("TEST_INT", "not-a-number")

		result := getEnvAsInt("TEST_INT", 5678)

		assert.Equal(t, 5678, result)
		os.Unsetenv("TEST_INT")
	})

	t.Run("should return default when environment variable is empty", func(t *testing.T) {
		os.Setenv("TEST_INT", "")

		result := getEnvAsInt("TEST_INT", 5678)

		assert.Equal(t, 5678, result)
		os.Unsetenv("TEST_INT")
	})

	t.Run("should handle negative integers", func(t *testing.T) {
		os.Setenv("TEST_INT", "-42")

		result := getEnvAsInt("TEST_INT", 100)

		assert.Equal(t, -42, result)
		os.Unsetenv("TEST_INT")
	})

	t.Run("should handle zero", func(t *testing.T) {
		os.Setenv("TEST_INT", "0")

		result := getEnvAsInt("TEST_INT", 100)

		assert.Equal(t, 0, result)
		os.Unsetenv("TEST_INT")
	})
}

// Helper function to clear environment variables used in tests
func clearEnvVars() {
	envVars := []string{
		"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_SSLMODE",
		"SERVER_PORT", "GIN_MODE", "LOG_LEVEL",
	}

	for _, key := range envVars {
		os.Unsetenv(key)
	}
}
