package repository

import (
	"context"

	"github.com/oscar/mileagetracker/internal/domain"
	"gorm.io/gorm"
)

type TripRepository interface {
	Create(ctx context.Context, trip *domain.Trip) error
	Update(ctx context.Context, trip *domain.Trip) error
	Delete(ctx context.Context, id uint) error
	FindByID(ctx context.Context, id uint) (*domain.Trip, error)
	GetPaginated(ctx context.Context, page, limit int) ([]domain.Trip, int64, error)
	GetMonthlySummary(ctx context.Context, startDate, endDate string) ([]domain.MonthlySummary, error)
}

type tripRepository struct {
	db *gorm.DB
}

func NewTripRepository(db *gorm.DB) TripRepository {
	return &tripRepository{db: db}
}

func (r *tripRepository) Create(ctx context.Context, trip *domain.Trip) error {
	return r.db.WithContext(ctx).Create(trip).Error
}

func (r *tripRepository) Update(ctx context.Context, trip *domain.Trip) error {
	return r.db.WithContext(ctx).Save(trip).Error
}

func (r *tripRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Trip{}, id).Error
}

func (r *tripRepository) FindByID(ctx context.Context, id uint) (*domain.Trip, error) {
	var trip domain.Trip
	err := r.db.WithContext(ctx).First(&trip, id).Error
	if err != nil {
		return nil, err
	}
	return &trip, nil
}

func (r *tripRepository) GetPaginated(ctx context.Context, page, limit int) ([]domain.Trip, int64, error) {
	var trips []domain.Trip
	var total int64

	offset := (page - 1) * limit

	// Get total count
	if err := r.db.WithContext(ctx).Model(&domain.Trip{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated trips
	err := r.db.WithContext(ctx).Order("trip_date DESC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&trips).Error

	return trips, total, err
}

func (r *tripRepository) GetMonthlySummary(ctx context.Context, startDate, endDate string) ([]domain.MonthlySummary, error) {
	var results []domain.MonthlySummary

	query := `
		SELECT 
			TO_CHAR(DATE_TRUNC('month', trip_date::date), 'FMMonth YYYY') as month,
			EXTRACT(YEAR FROM trip_date::date)::int as year,
			EXTRACT(MONTH FROM trip_date::date)::int as month_num,
			COALESCE(SUM(miles), 0) as total_miles
		FROM trips 
		WHERE trip_date >= ? AND trip_date <= ?
		GROUP BY DATE_TRUNC('month', trip_date::date), year, month_num
		ORDER BY year DESC, month_num DESC
	`

	err := r.db.WithContext(ctx).Raw(query, startDate, endDate).Scan(&results).Error
	return results, err
}
