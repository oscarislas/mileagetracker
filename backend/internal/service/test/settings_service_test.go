package service_test

import (
	"testing"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/oscar/mileagetracker/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

func TestSettingsService_GetSettings(t *testing.T) {
	mockSettingsRepo := new(MockSettingsRepository)
	settingsService := service.NewSettingsService(mockSettingsRepo)

	t.Run("should return settings successfully", func(t *testing.T) {
		// Setup
		mileageRateSetting := &domain.Settings{
			ID:    1,
			Key:   "mileage_rate",
			Value: "0.67",
		}

		// Mock expectations
		mockSettingsRepo.On("GetByKey", "mileage_rate").Return(mileageRateSetting, nil)

		// Execute
		result, err := settingsService.GetSettings()

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, float64(0.67), result.MileageRate)

		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should return default when setting not found", func(t *testing.T) {
		// Mock expectations
		mockSettingsRepo.On("GetByKey", "mileage_rate").Return(nil, gorm.ErrRecordNotFound)

		// Execute
		result, err := settingsService.GetSettings()

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, float64(0.67), result.MileageRate) // Default value

		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should return default when value is invalid", func(t *testing.T) {
		// Setup
		mileageRateSetting := &domain.Settings{
			ID:    1,
			Key:   "mileage_rate",
			Value: "invalid_float",
		}

		// Mock expectations
		mockSettingsRepo.On("GetByKey", "mileage_rate").Return(mileageRateSetting, nil)

		// Execute
		result, err := settingsService.GetSettings()

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, float64(0.67), result.MileageRate) // Default value

		mockSettingsRepo.AssertExpectations(t)
	})
}

// MockSettingsRepository implements the SettingsRepository interface for testing
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
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.Settings), args.Error(1)
}

func TestSettingsService_UpdateSettings(t *testing.T) {
	mockSettingsRepo := new(MockSettingsRepository)
	settingsService := service.NewSettingsService(mockSettingsRepo)

	t.Run("should update settings successfully", func(t *testing.T) {
		// Setup
		updateRequest := domain.UpdateSettingsRequest{
			MileageRate: 0.75,
		}

		// Mock expectations
		mockSettingsRepo.On("UpdateByKey", "mileage_rate", "0.75").Return(nil)

		// Execute
		result, err := settingsService.UpdateSettings(updateRequest)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, float64(0.75), result.MileageRate)

		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should handle negative mileage rate", func(t *testing.T) {
		// Setup
		updateRequest := domain.UpdateSettingsRequest{
			MileageRate: -0.5,
		}

		// Execute
		result, err := settingsService.UpdateSettings(updateRequest)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "mileage rate must be non-negative")

		// No expectations because the method should fail before calling repo
		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should handle zero mileage rate", func(t *testing.T) {
		// Setup
		updateRequest := domain.UpdateSettingsRequest{
			MileageRate: 0.0,
		}

		// Mock expectations
		mockSettingsRepo.On("UpdateByKey", "mileage_rate", "0").Return(nil)

		// Execute
		result, err := settingsService.UpdateSettings(updateRequest)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, float64(0.0), result.MileageRate)

		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should handle database error during update", func(t *testing.T) {
		// Setup
		updateRequest := domain.UpdateSettingsRequest{
			MileageRate: 0.67,
		}
		dbError := gorm.ErrInvalidDB

		// Mock expectations
		mockSettingsRepo.On("UpdateByKey", "mileage_rate", "0.67").Return(dbError)

		// Execute
		result, err := settingsService.UpdateSettings(updateRequest)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, dbError, err)

		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should handle decimal precision correctly", func(t *testing.T) {
		// Setup
		updateRequest := domain.UpdateSettingsRequest{
			MileageRate: 0.655,
		}

		// Mock expectations
		mockSettingsRepo.On("UpdateByKey", "mileage_rate", "0.655").Return(nil)

		// Execute
		result, err := settingsService.UpdateSettings(updateRequest)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, float64(0.655), result.MileageRate)

		mockSettingsRepo.AssertExpectations(t)
	})
}

