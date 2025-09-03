package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/oscar/mileagetracker/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// Mock repositories
type MockTripRepository struct {
	mock.Mock
}

func (m *MockTripRepository) Create(ctx context.Context, trip *domain.Trip) error {
	args := m.Called(ctx, trip)
	return args.Error(0)
}

func (m *MockTripRepository) Update(ctx context.Context, trip *domain.Trip) error {
	args := m.Called(ctx, trip)
	return args.Error(0)
}

func (m *MockTripRepository) Delete(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockTripRepository) FindByID(ctx context.Context, id uint) (*domain.Trip, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*domain.Trip), args.Error(1)
}

func (m *MockTripRepository) GetPaginated(ctx context.Context, page, limit int) ([]domain.Trip, int64, error) {
	args := m.Called(ctx, page, limit)
	return args.Get(0).([]domain.Trip), args.Get(1).(int64), args.Error(2)
}

func (m *MockTripRepository) GetMonthlySummary(ctx context.Context, startDate, endDate string) ([]domain.MonthlySummary, error) {
	args := m.Called(ctx, startDate, endDate)
	return args.Get(0).([]domain.MonthlySummary), args.Error(1)
}

type MockTripClientService struct {
	mock.Mock
}

func (m *MockTripClientService) GetOrCreateClient(ctx context.Context, name string) (*domain.Client, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Client), args.Error(1)
}

func (m *MockTripClientService) GetSuggestions(ctx context.Context, query string) ([]domain.Client, error) {
	args := m.Called(ctx, query)
	return args.Get(0).([]domain.Client), args.Error(1)
}

type MockTripSettingsRepository struct {
	mock.Mock
}

func (m *MockTripSettingsRepository) GetByKey(ctx context.Context, key string) (*domain.Settings, error) {
	args := m.Called(ctx, key)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Settings), args.Error(1)
}

func (m *MockTripSettingsRepository) UpdateByKey(ctx context.Context, key, value string) error {
	args := m.Called(ctx, key, value)
	return args.Error(0)
}

func (m *MockTripSettingsRepository) GetAll(ctx context.Context) ([]domain.Settings, error) {
	args := m.Called(ctx)
	return args.Get(0).([]domain.Settings), args.Error(1)
}

func TestTripService_CreateTrip(t *testing.T) {
	mockTripRepo := new(MockTripRepository)
	mockClientService := new(MockTripClientService)
	mockSettingsRepo := new(MockTripSettingsRepository)

	tripService := service.NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

	t.Run("should create trip successfully", func(t *testing.T) {
		// Setup
		req := domain.CreateTripRequest{
			ClientName: "Test Client",
			TripDate:   "2025-01-15",
			Miles:      100.5,
			Notes:      "Test trip",
		}

		expectedClient := &domain.Client{
			ID:   1,
			Name: "Test Client",
		}

		// Mock expectations
		mockClientService.On("GetOrCreateClient", mock.Anything, "Test Client").Return(expectedClient, nil)
		mockTripRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Trip")).Return(nil).Run(func(args mock.Arguments) {
			trip := args.Get(1).(*domain.Trip)
			trip.ID = 1
		})

		// Execute
		result, err := tripService.CreateTrip(context.Background(), req)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, req.ClientName, result.ClientName)
		assert.Equal(t, req.Miles, result.Miles)

		mockTripRepo.AssertExpectations(t)
		mockClientService.AssertExpectations(t)
	})

	t.Run("should return error for invalid date format", func(t *testing.T) {
		// Setup
		req := domain.CreateTripRequest{
			ClientName: "Test Client",
			TripDate:   "invalid-date",
			Miles:      100.5,
			Notes:      "Test trip",
		}

		// Execute
		result, err := tripService.CreateTrip(context.Background(), req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "invalid date format")
	})

	t.Run("should create new client if not exists", func(t *testing.T) {
		// Setup
		req := domain.CreateTripRequest{
			ClientName: "New Client",
			TripDate:   "2025-01-15",
			Miles:      50.0,
			Notes:      "New client trip",
		}

		newClient := &domain.Client{
			ID:   2,
			Name: "New Client",
		}

		// Mock expectations
		mockClientService.On("GetOrCreateClient", mock.Anything, "New Client").Return(newClient, nil)
		mockTripRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Trip")).Return(nil).Run(func(args mock.Arguments) {
			trip := args.Get(1).(*domain.Trip)
			trip.ID = 2
		})

		// Execute
		result, err := tripService.CreateTrip(context.Background(), req)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, req.ClientName, result.ClientName)

		mockTripRepo.AssertExpectations(t)
		mockClientService.AssertExpectations(t)
	})
}

func TestTripService_GetSummary(t *testing.T) {
	mockTripRepo := new(MockTripRepository)
	mockClientService := new(MockTripClientService)
	mockSettingsRepo := new(MockTripSettingsRepository)

	tripService := service.NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

	t.Run("should return summary with calculated amounts", func(t *testing.T) {
		// Setup
		now := time.Now()
		mockSummaries := []domain.MonthlySummary{
			{
				Month:      "September 2025",
				Year:       2025,
				MonthNum:   9,
				TotalMiles: 100.0,
			},
			{
				Month:      "August 2025",
				Year:       2025,
				MonthNum:   8,
				TotalMiles: 50.0,
			},
		}

		settings := &domain.Settings{
			Key:   "mileage_rate",
			Value: "0.67",
		}

		// Mock expectations
		startDate := now.AddDate(0, -5, 0).Format("2006-01-01")
		endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location()).Format("2006-01-02")
		mockTripRepo.On("GetMonthlySummary", mock.Anything, startDate, endDate).Return(mockSummaries, nil)
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(settings, nil)

		// Execute
		result, err := tripService.GetSummary(context.Background())

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Len(t, result.Months, 6) // Should fill missing months with zeros

		// Check calculated amounts
		foundSep := false
		for _, month := range result.Months {
			if month.Month == "September 2025" {
				assert.Equal(t, 100.0, month.TotalMiles)
				assert.Equal(t, 67.0, month.Amount) // 100 * 0.67
				foundSep = true
			}
		}
		assert.True(t, foundSep, "September 2025 should be found in results")

		mockTripRepo.AssertExpectations(t)
		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should use default rate when settings not found", func(t *testing.T) {
		// Setup
		now := time.Now()
		mockSummaries := []domain.MonthlySummary{
			{
				Month:      "September 2025",
				Year:       2025,
				MonthNum:   9,
				TotalMiles: 100.0,
			},
		}

		// Mock expectations
		startDate := now.AddDate(0, -5, 0).Format("2006-01-01")
		endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location()).Format("2006-01-02")
		mockTripRepo.On("GetMonthlySummary", mock.Anything, startDate, endDate).Return(mockSummaries, nil)
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(nil, gorm.ErrRecordNotFound)

		// Execute
		result, err := tripService.GetSummary(context.Background())

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Should use default rate of 0.67
		foundSep := false
		for _, month := range result.Months {
			if month.Month == "September 2025" {
				assert.Equal(t, 100.0, month.TotalMiles)
				assert.Equal(t, 67.0, month.Amount) // 100 * 0.67 (default)
				foundSep = true
			}
		}
		assert.True(t, foundSep, "September 2025 should be found in results")

		mockTripRepo.AssertExpectations(t)
		mockSettingsRepo.AssertExpectations(t)
	})
}
