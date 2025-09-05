package repository

import (
	"context"
	"sync"
	"time"

	"github.com/oscar/mileagetracker/internal/logger"
	"go.uber.org/zap"
)

// QueryPerformanceMonitor provides utilities for monitoring query performance
// and logging slow queries in a consistent manner across all repositories.
type QueryPerformanceMonitor struct {
	thresholds map[string]time.Duration
	mu         sync.RWMutex
}

// Operation types for different database operations
const (
	OpCreate            = "create"
	OpUpdate            = "update"
	OpDelete            = "delete"
	OpFind              = "find"
	OpFindByID          = "find_by_id"
	OpFindByName        = "find_by_name"
	OpGetSuggestions    = "get_suggestions"
	OpGetPaginated      = "get_paginated"
	OpGetMonthlySummary = "get_monthly_summary"
	OpGetByKey          = "get_by_key"
	OpUpdateByKey       = "update_by_key"
	OpGetAll            = "get_all"
)

// Default thresholds for different operation types (in milliseconds)
var defaultThresholds = map[string]time.Duration{
	OpCreate:            50 * time.Millisecond,
	OpUpdate:            50 * time.Millisecond,
	OpDelete:            50 * time.Millisecond,
	OpFind:              30 * time.Millisecond,
	OpFindByID:          30 * time.Millisecond,
	OpFindByName:        30 * time.Millisecond,
	OpGetSuggestions:    100 * time.Millisecond,
	OpGetPaginated:      100 * time.Millisecond,
	OpGetMonthlySummary: 200 * time.Millisecond,
	OpGetByKey:          20 * time.Millisecond,
	OpUpdateByKey:       100 * time.Millisecond,
	OpGetAll:            50 * time.Millisecond,
}

var (
	monitor *QueryPerformanceMonitor
	once    sync.Once
)

// GetQueryPerformanceMonitor returns the singleton instance of QueryPerformanceMonitor
func GetQueryPerformanceMonitor() *QueryPerformanceMonitor {
	once.Do(func() {
		monitor = &QueryPerformanceMonitor{
			thresholds: make(map[string]time.Duration),
		}
		// Initialize with default thresholds
		for op, threshold := range defaultThresholds {
			monitor.thresholds[op] = threshold
		}
	})
	return monitor
}

// SetThreshold allows customizing the threshold for specific operations
func (m *QueryPerformanceMonitor) SetThreshold(operation string, threshold time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.thresholds[operation] = threshold
}

// GetThreshold returns the threshold for a specific operation
func (m *QueryPerformanceMonitor) GetThreshold(operation string) time.Duration {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if threshold, exists := m.thresholds[operation]; exists {
		return threshold
	}
	// Default fallback threshold
	return 50 * time.Millisecond
}

// MonitorQuery wraps a database operation with performance monitoring.
// It returns a function that should be called with defer to log slow queries.
func (m *QueryPerformanceMonitor) MonitorQuery(operation, entity string, params ...zap.Field) func() {
	start := time.Now()
	threshold := m.GetThreshold(operation)

	return func() {
		duration := time.Since(start)
		if duration > threshold {
			fields := []zap.Field{
				zap.String("operation", operation),
				zap.String("entity", entity),
				zap.Duration("duration", duration),
				zap.Duration("threshold", threshold),
			}
			fields = append(fields, params...)

			logger.Warn("Slow query detected", fields...)
		}
	}
}

// WithTimeout creates a context with timeout for database operations.
// It provides consistent timeout handling across all repositories.
func WithTimeout(ctx context.Context, timeout time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, timeout)
}

// Common timeout values for different operation types
const (
	TimeoutFastRead    = 2 * time.Second  // For simple reads by ID, key
	TimeoutRead        = 3 * time.Second  // For basic queries with filters
	TimeoutWrite       = 3 * time.Second  // For create, update, delete
	TimeoutComplexRead = 5 * time.Second  // For paginated queries
	TimeoutAggregation = 10 * time.Second // For complex aggregation queries
)

// GetTimeoutForOperation returns the appropriate timeout for different operation types
func GetTimeoutForOperation(operation string) time.Duration {
	switch operation {
	case OpFind, OpFindByID, OpFindByName, OpGetByKey:
		return TimeoutFastRead
	case OpCreate, OpUpdate, OpDelete, OpUpdateByKey:
		return TimeoutWrite
	case OpGetPaginated, OpGetSuggestions, OpGetAll:
		return TimeoutComplexRead
	case OpGetMonthlySummary:
		return TimeoutAggregation
	default:
		return TimeoutRead
	}
}
