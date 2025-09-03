package service

import (
	"context"
	"fmt"
	"testing"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

func TestSettingsService_GetSettings(t *testing.T) {
	mockSettingsRepo := new(MockSettingsRepository)
	settingsService := NewSettingsService(mockSettingsRepo)

	t.Run("should return settings successfully", func(t *testing.T) {
		// Setup
		mileageRateSetting := &domain.Settings{
			ID:    1,
			Key:   "mileage_rate",
			Value: "0.67",
		}

		// Mock expectations
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(mileageRateSetting, nil)

		// Execute
		result, err := settingsService.GetSettings(context.Background())

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, float64(0.67), result.MileageRate)

		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should return default when setting not found", func(t *testing.T) {
		// Mock expectations
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(nil, gorm.ErrRecordNotFound)

		// Execute
		result, err := settingsService.GetSettings(context.Background())

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
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(mileageRateSetting, nil)

		// Execute
		result, err := settingsService.GetSettings(context.Background())

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, float64(0.67), result.MileageRate) // Default value

		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should handle various invalid value formats", func(t *testing.T) {
		testCases := []struct {
			name  string
			value string
		}{
			{"empty string", ""},
			{"alphabetic", "abc"},
			{"special chars", "!@#$%"},
			{"mixed alphanumeric", "12.3abc"},
			{"scientific notation invalid", "1.23e"},
			{"multiple dots", "1.2.3"},
			{"negative signs", "--1.23"},
			{"currency format", "$1.23"},
			{"percentage", "12.3%"},
			{"fraction", "1/2"},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				// Setup - create fresh mocks for each test
				freshMockSettingsRepo := new(MockSettingsRepository)
				freshSettingsService := NewSettingsService(freshMockSettingsRepo)

				mileageRateSetting := &domain.Settings{
					ID:    1,
					Key:   "mileage_rate",
					Value: tc.value,
				}

				// Mock expectations
				freshMockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(mileageRateSetting, nil)

				// Execute
				result, err := freshSettingsService.GetSettings(context.Background())

				// Assert
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, float64(0.67), result.MileageRate) // Should always default

				freshMockSettingsRepo.AssertExpectations(t)
			})
		}
	})

	t.Run("should handle edge case valid values", func(t *testing.T) {
		testCases := []struct {
			name     string
			value    string
			expected float64
		}{
			{"zero", "0", 0.0},
			{"zero with decimal", "0.0", 0.0},
			{"small positive", "0.001", 0.001},
			{"large positive", "999.99", 999.99},
			{"scientific notation", "1.23e2", 123.0},
			{"negative scientific", "1.23e-2", 0.0123},
			{"leading zeros", "00123.45", 123.45},
			{"trailing zeros", "123.450", 123.45},
			{"no decimal point", "123", 123.0},
			{"negative value", "-1.23", -1.23},
			{"very small", "1e-10", 1e-10},
			{"very large", "1e10", 1e10},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				// Setup - create fresh mocks for each test
				freshMockSettingsRepo := new(MockSettingsRepository)
				freshSettingsService := NewSettingsService(freshMockSettingsRepo)

				mileageRateSetting := &domain.Settings{
					ID:    1,
					Key:   "mileage_rate",
					Value: tc.value,
				}

				// Mock expectations
				freshMockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(mileageRateSetting, nil)

				// Execute
				result, err := freshSettingsService.GetSettings(context.Background())

				// Assert
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, tc.expected, result.MileageRate)

				freshMockSettingsRepo.AssertExpectations(t)
			})
		}
	})

	t.Run("should handle database errors other than record not found", func(t *testing.T) {
		testCases := []error{
			fmt.Errorf("connection timeout"),
			gorm.ErrInvalidDB,
			fmt.Errorf("permission denied"),
			fmt.Errorf("table not found"),
		}

		for i, dbError := range testCases {
			t.Run(fmt.Sprintf("database error %d", i+1), func(t *testing.T) {
				// Setup - create fresh mocks for each test
				freshMockSettingsRepo := new(MockSettingsRepository)
				freshSettingsService := NewSettingsService(freshMockSettingsRepo)

				// Mock expectations - return non-record-not-found error
				freshMockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(nil, dbError)

				// Execute
				result, err := freshSettingsService.GetSettings(context.Background())

				// Assert - should still return default, current implementation doesn't distinguish errors
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, float64(0.67), result.MileageRate)

				freshMockSettingsRepo.AssertExpectations(t)
			})
		}
	})
}

// MockSettingsRepository implements the SettingsRepository interface for testing
type MockSettingsRepository struct {
	mock.Mock
}

func (m *MockSettingsRepository) GetByKey(ctx context.Context, key string) (*domain.Settings, error) {
	args := m.Called(ctx, key)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Settings), args.Error(1)
}

func (m *MockSettingsRepository) UpdateByKey(ctx context.Context, key, value string) error {
	args := m.Called(ctx, key, value)
	return args.Error(0)
}

func (m *MockSettingsRepository) GetAll(ctx context.Context) ([]domain.Settings, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.Settings), args.Error(1)
}

func TestSettingsService_UpdateSettings(t *testing.T) {
	mockSettingsRepo := new(MockSettingsRepository)
	settingsService := NewSettingsService(mockSettingsRepo)

	t.Run("should update settings successfully", func(t *testing.T) {
		// Setup
		updateRequest := domain.UpdateSettingsRequest{
			MileageRate: 0.75,
		}

		// Mock expectations
		mockSettingsRepo.On("UpdateByKey", mock.Anything, "mileage_rate", "0.75").Return(nil)

		// Execute
		result, err := settingsService.UpdateSettings(context.Background(), updateRequest)

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
		result, err := settingsService.UpdateSettings(context.Background(), updateRequest)

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
		mockSettingsRepo.On("UpdateByKey", mock.Anything, "mileage_rate", "0").Return(nil)

		// Execute
		result, err := settingsService.UpdateSettings(context.Background(), updateRequest)

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
		mockSettingsRepo.On("UpdateByKey", mock.Anything, "mileage_rate", "0.67").Return(dbError)

		// Execute
		result, err := settingsService.UpdateSettings(context.Background(), updateRequest)

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
		mockSettingsRepo.On("UpdateByKey", mock.Anything, "mileage_rate", "0.655").Return(nil)

		// Execute
		result, err := settingsService.UpdateSettings(context.Background(), updateRequest)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, float64(0.655), result.MileageRate)

		mockSettingsRepo.AssertExpectations(t)
	})
}
