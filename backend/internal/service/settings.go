package service

import (
	"context"
	"fmt"
	"strconv"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/oscar/mileagetracker/internal/repository"
)

type SettingsService interface {
	GetSettings(ctx context.Context) (*domain.SettingsResponse, error)
	UpdateSettings(ctx context.Context, req domain.UpdateSettingsRequest) (*domain.SettingsResponse, error)
}

type settingsService struct {
	settingsRepo repository.SettingsRepository
}

func NewSettingsService(settingsRepo repository.SettingsRepository) SettingsService {
	return &settingsService{
		settingsRepo: settingsRepo,
	}
}

func (s *settingsService) GetSettings(ctx context.Context) (*domain.SettingsResponse, error) {
	mileageRate, err := s.settingsRepo.GetByKey(ctx, "mileage_rate")
	if err != nil {
		// Return default if not found
		return &domain.SettingsResponse{
			MileageRate: 0.67,
		}, nil
	}

	// Convert string value to float64
	rate, err := strconv.ParseFloat(mileageRate.Value, 64)
	if err != nil {
		// Return default if invalid value
		return &domain.SettingsResponse{
			MileageRate: 0.67,
		}, nil
	}

	return &domain.SettingsResponse{
		MileageRate: rate,
	}, nil
}

func (s *settingsService) UpdateSettings(ctx context.Context, req domain.UpdateSettingsRequest) (*domain.SettingsResponse, error) {
	// Validate mileage rate (already validated by binding, but check again for safety)
	if req.MileageRate < 0 {
		return nil, fmt.Errorf("mileage rate must be non-negative")
	}

	// Convert float64 to string for database storage
	rateStr := strconv.FormatFloat(req.MileageRate, 'f', -1, 64)

	// Update the mileage rate
	err := s.settingsRepo.UpdateByKey(ctx, "mileage_rate", rateStr)
	if err != nil {
		return nil, err
	}

	return &domain.SettingsResponse{
		MileageRate: req.MileageRate,
	}, nil
}
