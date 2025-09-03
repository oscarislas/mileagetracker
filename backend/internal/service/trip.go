package service

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/oscar/mileagetracker/internal/repository"
)

type TripService interface {
	CreateTrip(ctx context.Context, req domain.CreateTripRequest) (*domain.Trip, error)
	UpdateTrip(ctx context.Context, id uint, req domain.UpdateTripRequest) (*domain.Trip, error)
	DeleteTrip(ctx context.Context, id uint) error
	GetTripByID(ctx context.Context, id uint) (*domain.Trip, error)
	GetTrips(ctx context.Context, page, limit int) ([]domain.Trip, int64, error)
	GetSummary(ctx context.Context) (*domain.SummaryResponse, error)
}

type tripService struct {
	tripRepo      repository.TripRepository
	clientService ClientService
	settingsRepo  repository.SettingsRepository
}

func NewTripService(
	tripRepo repository.TripRepository,
	clientService ClientService,
	settingsRepo repository.SettingsRepository,
) TripService {
	return &tripService{
		tripRepo:      tripRepo,
		clientService: clientService,
		settingsRepo:  settingsRepo,
	}
}

func (s *tripService) CreateTrip(ctx context.Context, req domain.CreateTripRequest) (*domain.Trip, error) {
	// Validate date format
	if _, err := time.Parse("2006-01-02", req.TripDate); err != nil {
		return nil, fmt.Errorf("invalid date format, expected YYYY-MM-DD")
	}

	// Get or create client
	client, err := s.clientService.GetOrCreateClient(ctx, req.ClientName)
	if err != nil {
		return nil, err
	}

	trip := &domain.Trip{
		ClientID:   &client.ID,
		ClientName: req.ClientName,
		TripDate:   req.TripDate,
		Miles:      req.Miles,
		Notes:      req.Notes,
	}

	err = s.tripRepo.Create(ctx, trip)
	if err != nil {
		return nil, err
	}

	return trip, nil
}

func (s *tripService) UpdateTrip(ctx context.Context, id uint, req domain.UpdateTripRequest) (*domain.Trip, error) {
	// Validate date format
	if _, err := time.Parse("2006-01-02", req.TripDate); err != nil {
		return nil, fmt.Errorf("invalid date format, expected YYYY-MM-DD")
	}

	// Get existing trip
	trip, err := s.tripRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Get or create client
	client, err := s.clientService.GetOrCreateClient(ctx, req.ClientName)
	if err != nil {
		return nil, err
	}

	// Update trip fields
	trip.ClientID = &client.ID
	trip.ClientName = req.ClientName
	trip.TripDate = req.TripDate
	trip.Miles = req.Miles
	trip.Notes = req.Notes

	err = s.tripRepo.Update(ctx, trip)
	if err != nil {
		return nil, err
	}

	return trip, nil
}

func (s *tripService) DeleteTrip(ctx context.Context, id uint) error {
	return s.tripRepo.Delete(ctx, id)
}

func (s *tripService) GetTripByID(ctx context.Context, id uint) (*domain.Trip, error) {
	return s.tripRepo.FindByID(ctx, id)
}

func (s *tripService) GetTrips(ctx context.Context, page, limit int) ([]domain.Trip, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	return s.tripRepo.GetPaginated(ctx, page, limit)
}

func (s *tripService) GetSummary(ctx context.Context) (*domain.SummaryResponse, error) {
	// Calculate date range for last 6 months
	now := time.Now()
	startDate := now.AddDate(0, -5, 0).Format("2006-01-01")                                                        // Start of 6 months ago
	endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location()).Format("2006-01-02") // Last day of current month

	// Get monthly summaries from repository
	summaries, err := s.tripRepo.GetMonthlySummary(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Get mileage rate
	mileageRate, err := s.getMileageRate(ctx)
	if err != nil {
		return nil, err
	}

	// Calculate amounts for each month
	for i := range summaries {
		summaries[i].Amount = summaries[i].TotalMiles * mileageRate
	}

	// Ensure we have 6 months of data (fill missing months with zeros)
	fullSummaries := s.fillMissingMonths(summaries, 6)

	return &domain.SummaryResponse{
		Months: fullSummaries,
	}, nil
}

func (s *tripService) getMileageRate(ctx context.Context) (float64, error) {
	settings, err := s.settingsRepo.GetByKey(ctx, "mileage_rate")
	if err != nil {
		return 0.67, nil // default rate
	}

	rate, err := strconv.ParseFloat(settings.Value, 64)
	if err != nil {
		return 0.67, nil // default rate
	}

	return rate, nil
}

func (s *tripService) fillMissingMonths(summaries []domain.MonthlySummary, monthCount int) []domain.MonthlySummary {
	now := time.Now()
	result := make([]domain.MonthlySummary, 0, monthCount)

	// Create a map of existing summaries
	summaryMap := make(map[string]domain.MonthlySummary)
	for _, summary := range summaries {
		key := fmt.Sprintf("%d-%02d", summary.Year, summary.MonthNum)
		summaryMap[key] = summary
	}

	// Generate the last 6 months
	for i := 0; i < monthCount; i++ {
		monthTime := now.AddDate(0, -i, 0)
		year := monthTime.Year()
		monthNum := int(monthTime.Month())
		monthName := monthTime.Format("January 2006")
		key := fmt.Sprintf("%d-%02d", year, monthNum)

		if summary, exists := summaryMap[key]; exists {
			result = append(result, summary)
		} else {
			result = append(result, domain.MonthlySummary{
				Month:      monthName,
				Year:       year,
				MonthNum:   monthNum,
				TotalMiles: 0,
				Amount:     0,
			})
		}
	}

	return result
}
