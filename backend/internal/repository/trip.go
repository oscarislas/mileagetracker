package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/oscar/mileagetracker/internal/domain"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type TripRepository interface {
	Create(ctx context.Context, trip *domain.Trip) error
	Update(ctx context.Context, trip *domain.Trip) error
	Delete(ctx context.Context, id uint) error
	FindByID(ctx context.Context, id uint) (*domain.Trip, error)
	GetPaginated(ctx context.Context, page, limit int, filters domain.TripFilters) ([]domain.Trip, int64, error)
	GetMonthlySummary(ctx context.Context, startDate, endDate string) ([]domain.MonthlySummary, error)
}

type tripRepository struct {
	db *gorm.DB
}

func NewTripRepository(db *gorm.DB) TripRepository {
	return &tripRepository{db: db}
}

// buildFilteredQuery applies filters to a GORM query
func (r *tripRepository) buildFilteredQuery(query *gorm.DB, filters domain.TripFilters) *gorm.DB {
	// Search filter - search in client_name and notes
	if filters.Search != "" {
		searchTerm := "%" + strings.ToLower(filters.Search) + "%"
		query = query.Where("LOWER(client_name) LIKE ? OR LOWER(notes) LIKE ?", searchTerm, searchTerm)
	}

	// Client filter - exact match (case insensitive)
	if filters.Client != "" {
		query = query.Where("LOWER(client_name) = LOWER(?)", filters.Client)
	}

	// Date range filters
	if filters.DateFrom != "" {
		query = query.Where("trip_date >= ?", filters.DateFrom)
	}
	if filters.DateTo != "" {
		query = query.Where("trip_date <= ?", filters.DateTo)
	}

	// Miles range filters
	if filters.MinMiles != nil {
		query = query.Where("miles >= ?", *filters.MinMiles)
	}
	if filters.MaxMiles != nil {
		query = query.Where("miles <= ?", *filters.MaxMiles)
	}

	return query
}

func (r *tripRepository) Create(ctx context.Context, trip *domain.Trip) error {
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpCreate, "trip")()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpCreate))
	defer cancel()

	return r.db.WithContext(ctxWithTimeout).Create(trip).Error
}

func (r *tripRepository) Update(ctx context.Context, trip *domain.Trip) error {
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpUpdate, "trip")()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpUpdate))
	defer cancel()

	return r.db.WithContext(ctxWithTimeout).Save(trip).Error
}

func (r *tripRepository) Delete(ctx context.Context, id uint) error {
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpDelete, "trip", zap.Uint("id", id))()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpDelete))
	defer cancel()

	return r.db.WithContext(ctxWithTimeout).Delete(&domain.Trip{}, id).Error
}

func (r *tripRepository) FindByID(ctx context.Context, id uint) (*domain.Trip, error) {
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpFindByID, "trip", zap.Uint("id", id))()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpFindByID))
	defer cancel()

	var trip domain.Trip
	err := r.db.WithContext(ctxWithTimeout).First(&trip, id).Error
	if err != nil {
		return nil, err
	}
	return &trip, nil
}

func (r *tripRepository) GetPaginated(ctx context.Context, page, limit int, filters domain.TripFilters) ([]domain.Trip, int64, error) {
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpGetPaginated, "trip", zap.Int("page", page), zap.Int("limit", limit))()

	var trips []domain.Trip
	var total int64

	offset := (page - 1) * limit

	// Add query timeout
	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpGetPaginated))
	defer cancel()

	// Start with base query
	baseQuery := r.db.WithContext(ctxWithTimeout).Table("trips")

	// Apply filters to the base query
	filteredQuery := r.buildFilteredQuery(baseQuery, filters)

	// Optimized query using window function to get count and data in single query for better performance
	// This prevents the N+1 query problem and uses the covering index
	var tripsWithCount []struct {
		domain.Trip
		TotalCount int64 `gorm:"column:total_count"`
	}

	err := filteredQuery.
		Select("*, COUNT(*) OVER() as total_count").
		Order("trip_date DESC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Scan(&tripsWithCount).Error

	if err != nil {
		return nil, 0, err
	}

	if len(tripsWithCount) == 0 {
		return []domain.Trip{}, 0, nil
	}

	// Extract trips and total count
	trips = make([]domain.Trip, len(tripsWithCount))
	for i, item := range tripsWithCount {
		trips[i] = item.Trip
		total = item.TotalCount
	}

	return trips, total, err
}

func (r *tripRepository) GetMonthlySummary(ctx context.Context, startDate, endDate string) ([]domain.MonthlySummary, error) {
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpGetMonthlySummary, "trip", zap.String("start_date", startDate), zap.String("end_date", endDate))()

	var results []domain.MonthlySummary

	// Add query timeout for aggregation queries
	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpGetMonthlySummary))
	defer cancel()

	// Optimized query that works with both PostgreSQL and SQLite
	// Uses the new composite index for better performance
	query := `
		SELECT 
			strftime('%Y-%m', trip_date) as month_key,
			CASE 
				WHEN strftime('%m', trip_date) = '01' THEN 'January'
				WHEN strftime('%m', trip_date) = '02' THEN 'February'
				WHEN strftime('%m', trip_date) = '03' THEN 'March'
				WHEN strftime('%m', trip_date) = '04' THEN 'April'
				WHEN strftime('%m', trip_date) = '05' THEN 'May'
				WHEN strftime('%m', trip_date) = '06' THEN 'June'
				WHEN strftime('%m', trip_date) = '07' THEN 'July'
				WHEN strftime('%m', trip_date) = '08' THEN 'August'
				WHEN strftime('%m', trip_date) = '09' THEN 'September'
				WHEN strftime('%m', trip_date) = '10' THEN 'October'
				WHEN strftime('%m', trip_date) = '11' THEN 'November'
				WHEN strftime('%m', trip_date) = '12' THEN 'December'
			END || ' ' || strftime('%Y', trip_date) as month,
			CAST(strftime('%Y', trip_date) AS INTEGER) as year,
			CAST(strftime('%m', trip_date) AS INTEGER) as month_num,
			COALESCE(SUM(miles), 0) as total_miles
		FROM trips 
		WHERE trip_date >= ? AND trip_date <= ?
			AND trip_date IS NOT NULL
		GROUP BY strftime('%Y-%m', trip_date), year, month_num
		ORDER BY year DESC, month_num DESC
	`

	// Check database dialect and use appropriate query
	if r.db.Dialector.Name() == "postgres" {
		// PostgreSQL-specific optimized query
		query = `
			SELECT 
				TO_CHAR(DATE_TRUNC('month', trip_date::date), 'FMMonth YYYY') as month,
				EXTRACT(YEAR FROM trip_date::date)::int as year,
				EXTRACT(MONTH FROM trip_date::date)::int as month_num,
				COALESCE(SUM(miles), 0) as total_miles
			FROM trips 
			WHERE trip_date >= ? AND trip_date <= ?
				AND trip_date IS NOT NULL
			GROUP BY DATE_TRUNC('month', trip_date::date), year, month_num
			ORDER BY year DESC, month_num DESC
		`
	}

	err := r.db.WithContext(ctxWithTimeout).Raw(query, startDate, endDate).Scan(&results).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get monthly summary: %w", err)
	}

	return results, nil
}
