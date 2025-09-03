package service_test

import (
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

func (m *MockTripRepository) Create(trip *domain.Trip) error {
	args := m.Called(trip)
	return args.Error(0)
}

func (m *MockTripRepository) Update(trip *domain.Trip) error {
	args := m.Called(trip)
	return args.Error(0)
}

func (m *MockTripRepository) Delete(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockTripRepository) FindByID(id uint) (*domain.Trip, error) {
	args := m.Called(id)
	return args.Get(0).(*domain.Trip), args.Error(1)
}

func (m *MockTripRepository) GetPaginated(page, limit int) ([]domain.Trip, int64, error) {
	args := m.Called(page, limit)
	return args.Get(0).([]domain.Trip), args.Get(1).(int64), args.Error(2)
}

func (m *MockTripRepository) GetMonthlySummary(startDate, endDate string) ([]domain.MonthlySummary, error) {
	args := m.Called(startDate, endDate)
	return args.Get(0).([]domain.MonthlySummary), args.Error(1)
}

type MockClientService struct {
	mock.Mock
}

func (m *MockClientService) GetOrCreateClient(name string) (*domain.Client, error) {
	args := m.Called(name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Client), args.Error(1)
}

func (m *MockClientService) GetSuggestions(query string) ([]domain.Client, error) {
	args := m.Called(query)
	return args.Get(0).([]domain.Client), args.Error(1)
}

type MockSettingsRepository struct {
	mock.Mock
}

func (m *MockSettingsRepository) GetByKey(key string) (*domain.Settings, error) {
	args := m.Called(key)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Settings), args.Error(1)
}

func (m *MockSettingsRepository) UpdateByKey(key, value string) error {
	args := m.Called(key, value)
	return args.Error(0)
}

func (m *MockSettingsRepository) GetAll() ([]domain.Settings, error) {
	args := m.Called()
	return args.Get(0).([]domain.Settings), args.Error(1)
}

func TestTripService_CreateTrip(t *testing.T) {
	mockTripRepo := new(MockTripRepository)
	mockClientService := new(MockClientService)
	mockSettingsRepo := new(MockSettingsRepository)

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
		mockClientService.On("GetOrCreateClient", "Test Client").Return(expectedClient, nil)
		mockTripRepo.On("Create", mock.AnythingOfType("*domain.Trip")).Return(nil).Run(func(args mock.Arguments) {
			trip := args.Get(0).(*domain.Trip)
			trip.ID = 1
		})

		// Execute
		result, err := tripService.CreateTrip(req)

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
		result, err := tripService.CreateTrip(req)

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
		mockClientService.On("GetOrCreateClient", "New Client").Return(newClient, nil)
		mockTripRepo.On("Create", mock.AnythingOfType("*domain.Trip")).Return(nil).Run(func(args mock.Arguments) {
			trip := args.Get(0).(*domain.Trip)
			trip.ID = 2
		})

		// Execute
		result, err := tripService.CreateTrip(req)

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
	mockClientService := new(MockClientService)
	mockSettingsRepo := new(MockSettingsRepository)

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
		mockTripRepo.On("GetMonthlySummary", startDate, endDate).Return(mockSummaries, nil)
		mockSettingsRepo.On("GetByKey", "mileage_rate").Return(settings, nil)

		// Execute
		result, err := tripService.GetSummary()

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
		mockTripRepo.On("GetMonthlySummary", startDate, endDate).Return(mockSummaries, nil)
		mockSettingsRepo.On("GetByKey", "mileage_rate").Return(nil, gorm.ErrRecordNotFound)

		// Execute
		result, err := tripService.GetSummary()

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
