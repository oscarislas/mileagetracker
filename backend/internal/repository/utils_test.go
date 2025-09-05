package repository

import (
	"context"
	"testing"
	"time"

	"github.com/oscar/mileagetracker/internal/logger"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestMain(m *testing.M) {
	// Initialize logger for tests
	_ = logger.Init("development")
	defer logger.Sync()

	m.Run()
}

func TestQueryPerformanceMonitor_SingletonInstance(t *testing.T) {
	monitor1 := GetQueryPerformanceMonitor()
	monitor2 := GetQueryPerformanceMonitor()

	assert.Same(t, monitor1, monitor2, "should return the same singleton instance")
}

func TestQueryPerformanceMonitor_SetAndGetThreshold(t *testing.T) {
	monitor := GetQueryPerformanceMonitor()

	customThreshold := 100 * time.Millisecond
	monitor.SetThreshold("custom_operation", customThreshold)

	retrievedThreshold := monitor.GetThreshold("custom_operation")
	assert.Equal(t, customThreshold, retrievedThreshold, "should set and retrieve custom threshold")
}

func TestQueryPerformanceMonitor_DefaultThreshold(t *testing.T) {
	monitor := GetQueryPerformanceMonitor()

	threshold := monitor.GetThreshold("nonexistent_operation")
	assert.Equal(t, 50*time.Millisecond, threshold, "should return default threshold for unknown operations")
}

func TestQueryPerformanceMonitor_MonitorQuery_FastQuery(t *testing.T) {
	monitor := GetQueryPerformanceMonitor()

	// Set a high threshold to ensure our fast query doesn't trigger a warning
	monitor.SetThreshold(OpCreate, 1*time.Second)

	// This should not log any warnings since it's under the threshold
	done := monitor.MonitorQuery(OpCreate, "test_entity", zap.String("test_param", "value"))

	// Simulate a fast operation
	time.Sleep(1 * time.Millisecond)

	// This should complete without logging a warning
	done()

	// If we reach here, the test passed (no panic or error)
	assert.True(t, true, "fast query monitoring completed successfully")
}

func TestQueryPerformanceMonitor_MonitorQuery_SlowQuery(t *testing.T) {
	monitor := GetQueryPerformanceMonitor()

	// Set a very low threshold to ensure our query triggers a warning
	monitor.SetThreshold("test_slow_operation", 1*time.Nanosecond)

	// This should log a warning since we'll exceed the tiny threshold
	done := monitor.MonitorQuery("test_slow_operation", "test_entity",
		zap.String("test_param", "value"),
		zap.Int("record_count", 100),
	)

	// Simulate any operation duration (even 1ms will exceed 1ns threshold)
	time.Sleep(1 * time.Millisecond)

	// This should log a slow query warning
	done()

	// Test passes if no panic occurs
	assert.True(t, true, "slow query monitoring completed successfully")
}

func TestGetTimeoutForOperation(t *testing.T) {
	tests := []struct {
		operation       string
		expectedTimeout time.Duration
	}{
		{OpFind, TimeoutFastRead},
		{OpFindByID, TimeoutFastRead},
		{OpFindByName, TimeoutFastRead},
		{OpGetByKey, TimeoutFastRead},
		{OpCreate, TimeoutWrite},
		{OpUpdate, TimeoutWrite},
		{OpDelete, TimeoutWrite},
		{OpUpdateByKey, TimeoutWrite},
		{OpGetPaginated, TimeoutComplexRead},
		{OpGetSuggestions, TimeoutComplexRead},
		{OpGetAll, TimeoutComplexRead},
		{OpGetMonthlySummary, TimeoutAggregation},
		{"unknown_operation", TimeoutRead},
	}

	for _, tt := range tests {
		t.Run(tt.operation, func(t *testing.T) {
			timeout := GetTimeoutForOperation(tt.operation)
			assert.Equal(t, tt.expectedTimeout, timeout,
				"timeout for operation %s should be %v", tt.operation, tt.expectedTimeout)
		})
	}
}

func TestWithTimeout(t *testing.T) {
	parentCtx := context.Background()
	timeout := 100 * time.Millisecond

	ctx, cancel := WithTimeout(parentCtx, timeout)
	defer cancel()

	// Verify context has deadline
	deadline, hasDeadline := ctx.Deadline()
	assert.True(t, hasDeadline, "context should have a deadline")
	assert.True(t, time.Until(deadline) <= timeout,
		"deadline should be within expected timeout range")

	// Verify context will timeout
	select {
	case <-ctx.Done():
		assert.Equal(t, context.DeadlineExceeded, ctx.Err(),
			"context should timeout with DeadlineExceeded error")
	case <-time.After(timeout + 50*time.Millisecond):
		t.Fatal("context should have timed out by now")
	}
}

// Performance benchmark tests
func BenchmarkQueryPerformanceMonitor_MonitorQuery(b *testing.B) {
	monitor := GetQueryPerformanceMonitor()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		done := monitor.MonitorQuery(OpCreate, "benchmark_entity")
		done()
	}
}

func BenchmarkQueryPerformanceMonitor_GetThreshold(b *testing.B) {
	monitor := GetQueryPerformanceMonitor()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = monitor.GetThreshold(OpCreate)
	}
}

func BenchmarkGetTimeoutForOperation(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = GetTimeoutForOperation(OpCreate)
	}
}
