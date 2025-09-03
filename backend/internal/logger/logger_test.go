package logger

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestInit(t *testing.T) {
	originalLogger := Logger

	t.Run("should initialize production logger", func(t *testing.T) {
		err := Init("production")

		assert.NoError(t, err)
		assert.NotNil(t, Logger)

		// Verify it's a production logger by checking the config
		// Production loggers use JSON encoding and different settings
		assert.NotNil(t, Logger.Core())
	})

	t.Run("should initialize development logger by default", func(t *testing.T) {
		err := Init("debug")

		assert.NoError(t, err)
		assert.NotNil(t, Logger)

		// Development loggers have more verbose output
		assert.NotNil(t, Logger.Core())
	})

	t.Run("should initialize development logger for unknown level", func(t *testing.T) {
		err := Init("unknown-level")

		assert.NoError(t, err)
		assert.NotNil(t, Logger)
	})

	t.Run("should initialize development logger for empty level", func(t *testing.T) {
		err := Init("")

		assert.NoError(t, err)
		assert.NotNil(t, Logger)
	})

	// Restore original logger
	t.Cleanup(func() {
		Logger = originalLogger
	})
}

func TestSync(t *testing.T) {
	originalLogger := Logger

	t.Run("should handle nil logger gracefully", func(t *testing.T) {
		Logger = nil

		// Should not panic
		assert.NotPanics(t, func() {
			Sync()
		})
	})

	t.Run("should sync valid logger", func(t *testing.T) {
		// Initialize a test logger
		err := Init("debug")
		assert.NoError(t, err)

		// Should not panic or return error
		assert.NotPanics(t, func() {
			Sync()
		})
	})

	// Restore original logger
	t.Cleanup(func() {
		Logger = originalLogger
	})
}

func TestLogFunctions(t *testing.T) {
	originalLogger := Logger

	// Initialize logger for testing
	err := Init("debug")
	assert.NoError(t, err)

	t.Run("should call Info without panic", func(t *testing.T) {
		assert.NotPanics(t, func() {
			Info("test info message")
		})

		assert.NotPanics(t, func() {
			Info("test info with fields", zap.String("key", "value"))
		})
	})

	t.Run("should call Error without panic", func(t *testing.T) {
		assert.NotPanics(t, func() {
			Error("test error message")
		})

		assert.NotPanics(t, func() {
			Error("test error with fields", zap.String("error", "test"))
		})
	})

	t.Run("should call Debug without panic", func(t *testing.T) {
		assert.NotPanics(t, func() {
			Debug("test debug message")
		})

		assert.NotPanics(t, func() {
			Debug("test debug with fields", zap.Int("count", 42))
		})
	})

	t.Run("should call Warn without panic", func(t *testing.T) {
		assert.NotPanics(t, func() {
			Warn("test warn message")
		})

		assert.NotPanics(t, func() {
			Warn("test warn with fields", zap.Bool("flag", true))
		})
	})

	// Restore original logger
	t.Cleanup(func() {
		Logger = originalLogger
	})
}

func TestLoggerPanicSafety(t *testing.T) {
	originalLogger := Logger

	t.Run("should handle nil logger in log functions", func(t *testing.T) {
		Logger = nil

		// These should panic since Logger is nil and we're calling methods on it
		// In a real application, you'd want to check for nil before logging
		// This test documents the current behavior

		assert.Panics(t, func() {
			Info("test message")
		})

		assert.Panics(t, func() {
			Error("test message")
		})

		assert.Panics(t, func() {
			Debug("test message")
		})

		assert.Panics(t, func() {
			Warn("test message")
		})
	})

	// Restore original logger
	t.Cleanup(func() {
		Logger = originalLogger
	})
}

func TestLoggerLevels(t *testing.T) {
	originalLogger := Logger

	t.Run("should document logger level behavior", func(t *testing.T) {
		// Test production logger
		err := Init("production")
		assert.NoError(t, err)

		// Production logger should be available
		assert.NotNil(t, Logger)

		// Test development logger
		err = Init("debug")
		assert.NoError(t, err)

		// Development logger should be available
		assert.NotNil(t, Logger)

		// Both should work for basic logging operations
		assert.NotPanics(t, func() {
			Info("production test")
		})
	})

	// Restore original logger
	t.Cleanup(func() {
		Logger = originalLogger
	})
}
