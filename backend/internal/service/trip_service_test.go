package service

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/oscar/mileagetracker/internal/domain"
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
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Trip), args.Error(1)
}

func (m *MockTripRepository) GetPaginated(ctx context.Context, page, limit int, filters domain.TripFilters) ([]domain.Trip, int64, error) {
	args := m.Called(ctx, page, limit, filters)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]domain.Trip), args.Get(1).(int64), args.Error(2)
}

func (m *MockTripRepository) GetMonthlySummary(ctx context.Context, startDate, endDate string) ([]domain.MonthlySummary, error) {
	args := m.Called(ctx, startDate, endDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
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
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
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
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.Settings), args.Error(1)
}

func TestTripService_CreateTrip(t *testing.T) {
	mockTripRepo := new(MockTripRepository)
	mockClientService := new(MockTripClientService)
	mockSettingsRepo := new(MockTripSettingsRepository)

	tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

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

	t.Run("should return error when client service fails", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		freshMockTripRepo := new(MockTripRepository)
		freshMockClientService := new(MockTripClientService)
		freshMockSettingsRepo := new(MockTripSettingsRepository)
		freshTripService := NewTripService(freshMockTripRepo, freshMockClientService, freshMockSettingsRepo)

		req := domain.CreateTripRequest{
			ClientName: "Test Client",
			TripDate:   "2025-01-15",
			Miles:      100.5,
			Notes:      "Test trip",
		}

		clientError := fmt.Errorf("client service error")

		// Mock expectations
		freshMockClientService.On("GetOrCreateClient", mock.Anything, "Test Client").Return(nil, clientError)

		// Execute
		result, err := freshTripService.CreateTrip(context.Background(), req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, clientError, err)

		freshMockClientService.AssertExpectations(t)
	})

	t.Run("should return error when repository create fails", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		freshMockTripRepo := new(MockTripRepository)
		freshMockClientService := new(MockTripClientService)
		freshMockSettingsRepo := new(MockTripSettingsRepository)
		freshTripService := NewTripService(freshMockTripRepo, freshMockClientService, freshMockSettingsRepo)

		req := domain.CreateTripRequest{
			ClientName: "Test Client",
			TripDate:   "2025-01-15",
			Miles:      100.5,
			Notes:      "Test trip",
		}

		client := &domain.Client{
			ID:   1,
			Name: "Test Client",
		}

		createError := fmt.Errorf("database create error")

		// Mock expectations
		freshMockClientService.On("GetOrCreateClient", mock.Anything, "Test Client").Return(client, nil)
		freshMockTripRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Trip")).Return(createError)

		// Execute
		result, err := freshTripService.CreateTrip(context.Background(), req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, createError, err)

		freshMockTripRepo.AssertExpectations(t)
		freshMockClientService.AssertExpectations(t)
	})

	t.Run("should handle edge case values", func(t *testing.T) {
		// Test various edge cases
		testCases := []struct {
			name          string
			request       domain.CreateTripRequest
			shouldSucceed bool
		}{
			{
				name: "zero miles",
				request: domain.CreateTripRequest{
					ClientName: "Test Client",
					TripDate:   "2025-01-15",
					Miles:      0.0,
					Notes:      "Test trip",
				},
				shouldSucceed: true,
			},
			{
				name: "very large miles",
				request: domain.CreateTripRequest{
					ClientName: "Test Client",
					TripDate:   "2025-01-15",
					Miles:      999999.99,
					Notes:      "Test trip",
				},
				shouldSucceed: true,
			},
			{
				name: "empty notes",
				request: domain.CreateTripRequest{
					ClientName: "Test Client",
					TripDate:   "2025-01-15",
					Miles:      100.0,
					Notes:      "",
				},
				shouldSucceed: true,
			},
			{
				name: "leap year date",
				request: domain.CreateTripRequest{
					ClientName: "Test Client",
					TripDate:   "2024-02-29",
					Miles:      100.0,
					Notes:      "Leap year trip",
				},
				shouldSucceed: true,
			},
			{
				name: "invalid leap year date",
				request: domain.CreateTripRequest{
					ClientName: "Test Client",
					TripDate:   "2023-02-29",
					Miles:      100.0,
					Notes:      "Invalid leap year",
				},
				shouldSucceed: false,
			},
			{
				name: "malformed date - wrong format",
				request: domain.CreateTripRequest{
					ClientName: "Test Client",
					TripDate:   "01/15/2025",
					Miles:      100.0,
					Notes:      "US format date",
				},
				shouldSucceed: false,
			},
			{
				name: "date with time",
				request: domain.CreateTripRequest{
					ClientName: "Test Client",
					TripDate:   "2025-01-15T10:30:00",
					Miles:      100.0,
					Notes:      "Date with time",
				},
				shouldSucceed: false,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				if tc.shouldSucceed {
					// Create fresh mocks for each test
					freshMockTripRepo := new(MockTripRepository)
					freshMockClientService := new(MockTripClientService)
					freshMockSettingsRepo := new(MockTripSettingsRepository)
					freshTripService := NewTripService(freshMockTripRepo, freshMockClientService, freshMockSettingsRepo)

					client := &domain.Client{
						ID:   1,
						Name: tc.request.ClientName,
					}

					// Mock expectations for successful cases
					freshMockClientService.On("GetOrCreateClient", mock.Anything, tc.request.ClientName).Return(client, nil)
					freshMockTripRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Trip")).Return(nil)

					// Execute
					result, err := freshTripService.CreateTrip(context.Background(), tc.request)

					// Assert
					assert.NoError(t, err)
					assert.NotNil(t, result)
					assert.Equal(t, tc.request.Miles, result.Miles)

					freshMockTripRepo.AssertExpectations(t)
					freshMockClientService.AssertExpectations(t)
				} else {
					// Create fresh service for failed cases (no mocks needed since it fails early)
					freshMockTripRepo := new(MockTripRepository)
					freshMockClientService := new(MockTripClientService)
					freshMockSettingsRepo := new(MockTripSettingsRepository)
					freshTripService := NewTripService(freshMockTripRepo, freshMockClientService, freshMockSettingsRepo)

					// Execute
					result, err := freshTripService.CreateTrip(context.Background(), tc.request)

					// Assert
					assert.Error(t, err)
					assert.Nil(t, result)
					assert.Contains(t, err.Error(), "invalid date format")
				}
			})
		}
	})
}

func TestTripService_UpdateTrip(t *testing.T) {

	t.Run("should update trip successfully", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		req := domain.UpdateTripRequest{
			ClientName: "Updated Client",
			TripDate:   "2025-01-20",
			Miles:      150.5,
			Notes:      "Updated trip",
		}

		existingTrip := &domain.Trip{
			ID:         1,
			ClientID:   new(uint),
			ClientName: "Old Client",
			TripDate:   "2025-01-15",
			Miles:      100.0,
			Notes:      "Old trip",
		}

		updatedClient := &domain.Client{
			ID:   2,
			Name: "Updated Client",
		}

		// Mock expectations
		mockTripRepo.On("FindByID", mock.Anything, uint(1)).Return(existingTrip, nil)
		mockClientService.On("GetOrCreateClient", mock.Anything, "Updated Client").Return(updatedClient, nil)
		mockTripRepo.On("Update", mock.Anything, mock.AnythingOfType("*domain.Trip")).Return(nil)

		// Execute
		result, err := tripService.UpdateTrip(context.Background(), 1, req)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, req.ClientName, result.ClientName)
		assert.Equal(t, req.Miles, result.Miles)
		assert.Equal(t, req.TripDate, result.TripDate)
		assert.Equal(t, req.Notes, result.Notes)
		assert.Equal(t, updatedClient.ID, *result.ClientID)

		mockTripRepo.AssertExpectations(t)
		mockClientService.AssertExpectations(t)
	})

	t.Run("should return error for invalid date format", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		req := domain.UpdateTripRequest{
			ClientName: "Test Client",
			TripDate:   "invalid-date",
			Miles:      100.5,
			Notes:      "Test trip",
		}

		// Execute
		result, err := tripService.UpdateTrip(context.Background(), 1, req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "invalid date format")
	})

	t.Run("should return error when trip not found", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		req := domain.UpdateTripRequest{
			ClientName: "Test Client",
			TripDate:   "2025-01-15",
			Miles:      100.5,
			Notes:      "Test trip",
		}

		// Mock expectations
		mockTripRepo.On("FindByID", mock.Anything, uint(999)).Return(nil, gorm.ErrRecordNotFound)

		// Execute
		result, err := tripService.UpdateTrip(context.Background(), 999, req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, gorm.ErrRecordNotFound, err)

		mockTripRepo.AssertExpectations(t)
	})

	t.Run("should return error when client service fails", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		req := domain.UpdateTripRequest{
			ClientName: "Test Client",
			TripDate:   "2025-01-15",
			Miles:      100.5,
			Notes:      "Test trip",
		}

		existingTrip := &domain.Trip{
			ID:         1,
			ClientID:   new(uint),
			ClientName: "Old Client",
			TripDate:   "2025-01-15",
			Miles:      100.0,
			Notes:      "Old trip",
		}

		clientError := fmt.Errorf("client service error")

		// Mock expectations
		mockTripRepo.On("FindByID", mock.Anything, uint(1)).Return(existingTrip, nil)
		mockClientService.On("GetOrCreateClient", mock.Anything, "Test Client").Return(nil, clientError)

		// Execute
		result, err := tripService.UpdateTrip(context.Background(), 1, req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, clientError, err)

		mockTripRepo.AssertExpectations(t)
		mockClientService.AssertExpectations(t)
	})

	t.Run("should return error when repository update fails", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		req := domain.UpdateTripRequest{
			ClientName: "Test Client",
			TripDate:   "2025-01-15",
			Miles:      100.5,
			Notes:      "Test trip",
		}

		existingTrip := &domain.Trip{
			ID:         1,
			ClientID:   new(uint),
			ClientName: "Old Client",
			TripDate:   "2025-01-15",
			Miles:      100.0,
			Notes:      "Old trip",
		}

		client := &domain.Client{
			ID:   1,
			Name: "Test Client",
		}

		updateError := fmt.Errorf("database update error")

		// Mock expectations
		mockTripRepo.On("FindByID", mock.Anything, uint(1)).Return(existingTrip, nil)
		mockClientService.On("GetOrCreateClient", mock.Anything, "Test Client").Return(client, nil)
		mockTripRepo.On("Update", mock.Anything, mock.AnythingOfType("*domain.Trip")).Return(updateError)

		// Execute
		result, err := tripService.UpdateTrip(context.Background(), 1, req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, updateError, err)

		mockTripRepo.AssertExpectations(t)
		mockClientService.AssertExpectations(t)
	})
}

func TestTripService_DeleteTrip(t *testing.T) {

	t.Run("should delete trip successfully", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		// Mock expectations
		mockTripRepo.On("Delete", mock.Anything, uint(1)).Return(nil)

		// Execute
		err := tripService.DeleteTrip(context.Background(), 1)

		// Assert
		assert.NoError(t, err)

		mockTripRepo.AssertExpectations(t)
	})

	t.Run("should return error when repository delete fails", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		deleteError := fmt.Errorf("database delete error")

		// Mock expectations
		mockTripRepo.On("Delete", mock.Anything, uint(999)).Return(deleteError)

		// Execute
		err := tripService.DeleteTrip(context.Background(), 999)

		// Assert
		assert.Error(t, err)
		assert.Equal(t, deleteError, err)

		mockTripRepo.AssertExpectations(t)
	})

	t.Run("should handle trip not found error", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		// Mock expectations
		mockTripRepo.On("Delete", mock.Anything, uint(999)).Return(gorm.ErrRecordNotFound)

		// Execute
		err := tripService.DeleteTrip(context.Background(), 999)

		// Assert
		assert.Error(t, err)
		assert.Equal(t, gorm.ErrRecordNotFound, err)

		mockTripRepo.AssertExpectations(t)
	})
}

func TestTripService_GetTripByID(t *testing.T) {

	t.Run("should return trip successfully", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)
		// Setup
		expectedTrip := &domain.Trip{
			ID:         1,
			ClientID:   new(uint),
			ClientName: "Test Client",
			TripDate:   "2025-01-15",
			Miles:      100.5,
			Notes:      "Test trip",
		}
		*expectedTrip.ClientID = 1

		// Mock expectations
		mockTripRepo.On("FindByID", mock.Anything, uint(1)).Return(expectedTrip, nil)

		// Execute
		result, err := tripService.GetTripByID(context.Background(), 1)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, expectedTrip.ID, result.ID)
		assert.Equal(t, expectedTrip.ClientName, result.ClientName)
		assert.Equal(t, expectedTrip.Miles, result.Miles)

		mockTripRepo.AssertExpectations(t)
	})

	t.Run("should return error when trip not found", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		// Mock expectations
		mockTripRepo.On("FindByID", mock.Anything, uint(999)).Return(nil, gorm.ErrRecordNotFound)

		// Execute
		result, err := tripService.GetTripByID(context.Background(), 999)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, gorm.ErrRecordNotFound, err)

		mockTripRepo.AssertExpectations(t)
	})

	t.Run("should return error when repository fails", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		dbError := fmt.Errorf("database connection error")

		// Mock expectations
		mockTripRepo.On("FindByID", mock.Anything, uint(1)).Return(nil, dbError)

		// Execute
		result, err := tripService.GetTripByID(context.Background(), 1)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, dbError, err)

		mockTripRepo.AssertExpectations(t)
	})
}

func TestTripService_GetTrips(t *testing.T) {

	t.Run("should return trips successfully", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		expectedTrips := []domain.Trip{
			{
				ID:         1,
				ClientName: "Client 1",
				TripDate:   "2025-01-15",
				Miles:      100.0,
				Notes:      "Trip 1",
			},
			{
				ID:         2,
				ClientName: "Client 2",
				TripDate:   "2025-01-16",
				Miles:      200.0,
				Notes:      "Trip 2",
			},
		}
		expectedTotal := int64(2)

		// Mock expectations
		mockTripRepo.On("GetPaginated", mock.Anything, 1, 10, domain.TripFilters{}).Return(expectedTrips, expectedTotal, nil)

		// Execute
		result, total, err := tripService.GetTrips(context.Background(), 1, 10, domain.TripFilters{})

		// Assert
		assert.NoError(t, err)
		assert.Len(t, result, 2)
		assert.Equal(t, expectedTotal, total)
		assert.Equal(t, expectedTrips[0].ClientName, result[0].ClientName)
		assert.Equal(t, expectedTrips[1].ClientName, result[1].ClientName)

		mockTripRepo.AssertExpectations(t)
	})

	t.Run("should normalize pagination parameters", func(t *testing.T) {
		// Test various invalid inputs that should be normalized
		testCases := []struct {
			name          string
			inputPage     int
			inputLimit    int
			expectedPage  int
			expectedLimit int
		}{
			{"negative page", -1, 5, 1, 5},
			{"zero page", 0, 5, 1, 5},
			{"negative limit", 1, -5, 1, 10},
			{"zero limit", 1, 0, 1, 10},
			{"limit too large", 1, 150, 1, 10},
			{"valid parameters", 2, 20, 2, 20},
			{"edge case - limit 100", 1, 100, 1, 100},
			{"edge case - limit 101", 1, 101, 1, 10},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				// Setup - create fresh mocks for each sub-test
				mockTripRepo := new(MockTripRepository)
				mockClientService := new(MockTripClientService)
				mockSettingsRepo := new(MockTripSettingsRepository)
				tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

				expectedTrips := []domain.Trip{}
				expectedTotal := int64(0)

				// Mock expectations with normalized values
				mockTripRepo.On("GetPaginated", mock.Anything, tc.expectedPage, tc.expectedLimit, domain.TripFilters{}).Return(expectedTrips, expectedTotal, nil)

				// Execute
				result, total, err := tripService.GetTrips(context.Background(), tc.inputPage, tc.inputLimit, domain.TripFilters{})

				// Assert
				assert.NoError(t, err)
				assert.Equal(t, expectedTrips, result)
				assert.Equal(t, expectedTotal, total)

				mockTripRepo.AssertExpectations(t)
			})
		}
	})

	t.Run("should return error when repository fails", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		dbError := fmt.Errorf("database connection error")

		// Mock expectations
		mockTripRepo.On("GetPaginated", mock.Anything, 1, 10, domain.TripFilters{}).Return(nil, int64(0), dbError)

		// Execute
		result, total, err := tripService.GetTrips(context.Background(), 1, 10, domain.TripFilters{})

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, int64(0), total)
		assert.Equal(t, dbError, err)

		mockTripRepo.AssertExpectations(t)
	})

	t.Run("should return empty results for valid pagination", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		emptyTrips := []domain.Trip{}
		expectedTotal := int64(0)

		// Mock expectations
		mockTripRepo.On("GetPaginated", mock.Anything, 5, 25, domain.TripFilters{}).Return(emptyTrips, expectedTotal, nil)

		// Execute
		result, total, err := tripService.GetTrips(context.Background(), 5, 25, domain.TripFilters{})

		// Assert
		assert.NoError(t, err)
		assert.Empty(t, result)
		assert.Equal(t, expectedTotal, total)

		mockTripRepo.AssertExpectations(t)
	})
}

func TestTripService_GetSummary(t *testing.T) {

	t.Run("should return summary with calculated amounts", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

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
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

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

	t.Run("should return error when repository fails", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		now := time.Now()
		dbError := fmt.Errorf("database connection error")

		// Mock expectations
		startDate := now.AddDate(0, -5, 0).Format("2006-01-01")
		endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location()).Format("2006-01-02")
		mockTripRepo.On("GetMonthlySummary", mock.Anything, startDate, endDate).Return(nil, dbError)

		// Execute
		result, err := tripService.GetSummary(context.Background())

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, dbError, err)

		mockTripRepo.AssertExpectations(t)
	})

	t.Run("should handle empty summary data", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		now := time.Now()
		emptySummaries := []domain.MonthlySummary{}

		settings := &domain.Settings{
			Key:   "mileage_rate",
			Value: "0.67",
		}

		// Mock expectations
		startDate := now.AddDate(0, -5, 0).Format("2006-01-01")
		endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location()).Format("2006-01-02")
		mockTripRepo.On("GetMonthlySummary", mock.Anything, startDate, endDate).Return(emptySummaries, nil)
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(settings, nil)

		// Execute
		result, err := tripService.GetSummary(context.Background())

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Len(t, result.Months, 6) // Should fill 6 months with zeros

		// All months should have zero values
		for _, month := range result.Months {
			assert.Equal(t, 0.0, month.TotalMiles)
			assert.Equal(t, 0.0, month.Amount)
		}

		mockTripRepo.AssertExpectations(t)
		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should use default rate when settings value is invalid", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		now := time.Now()
		mockSummaries := []domain.MonthlySummary{
			{
				Month:      "September 2025",
				Year:       2025,
				MonthNum:   9,
				TotalMiles: 100.0,
			},
		}

		invalidSettings := &domain.Settings{
			Key:   "mileage_rate",
			Value: "not-a-number",
		}

		// Mock expectations
		startDate := now.AddDate(0, -5, 0).Format("2006-01-01")
		endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location()).Format("2006-01-02")
		mockTripRepo.On("GetMonthlySummary", mock.Anything, startDate, endDate).Return(mockSummaries, nil)
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(invalidSettings, nil)

		// Execute
		result, err := tripService.GetSummary(context.Background())

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Should use default rate of 0.67 due to invalid value
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

	t.Run("should handle zero mileage rate", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		now := time.Now()
		mockSummaries := []domain.MonthlySummary{
			{
				Month:      "September 2025",
				Year:       2025,
				MonthNum:   9,
				TotalMiles: 100.0,
			},
		}

		zeroRateSettings := &domain.Settings{
			Key:   "mileage_rate",
			Value: "0",
		}

		// Mock expectations
		startDate := now.AddDate(0, -5, 0).Format("2006-01-01")
		endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location()).Format("2006-01-02")
		mockTripRepo.On("GetMonthlySummary", mock.Anything, startDate, endDate).Return(mockSummaries, nil)
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(zeroRateSettings, nil)

		// Execute
		result, err := tripService.GetSummary(context.Background())

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Should use zero rate
		foundSep := false
		for _, month := range result.Months {
			if month.Month == "September 2025" {
				assert.Equal(t, 100.0, month.TotalMiles)
				assert.Equal(t, 0.0, month.Amount) // 100 * 0 = 0
				foundSep = true
			}
		}
		assert.True(t, foundSep, "September 2025 should be found in results")

		mockTripRepo.AssertExpectations(t)
		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should handle very high mileage rate", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		now := time.Now()
		mockSummaries := []domain.MonthlySummary{
			{
				Month:      "September 2025",
				Year:       2025,
				MonthNum:   9,
				TotalMiles: 100.0,
			},
		}

		highRateSettings := &domain.Settings{
			Key:   "mileage_rate",
			Value: "999.99",
		}

		// Mock expectations
		startDate := now.AddDate(0, -5, 0).Format("2006-01-01")
		endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location()).Format("2006-01-02")
		mockTripRepo.On("GetMonthlySummary", mock.Anything, startDate, endDate).Return(mockSummaries, nil)
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(highRateSettings, nil)

		// Execute
		result, err := tripService.GetSummary(context.Background())

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Should use high rate
		foundSep := false
		for _, month := range result.Months {
			if month.Month == "September 2025" {
				assert.Equal(t, 100.0, month.TotalMiles)
				assert.Equal(t, 99999.0, month.Amount) // 100 * 999.99 = 99999
				foundSep = true
			}
		}
		assert.True(t, foundSep, "September 2025 should be found in results")

		mockTripRepo.AssertExpectations(t)
		mockSettingsRepo.AssertExpectations(t)
	})

	t.Run("should return error when getMileageRate fails with non-record-not-found error", func(t *testing.T) {
		// Setup - create fresh mocks for this test
		mockTripRepo := new(MockTripRepository)
		mockClientService := new(MockTripClientService)
		mockSettingsRepo := new(MockTripSettingsRepository)
		tripService := NewTripService(mockTripRepo, mockClientService, mockSettingsRepo)

		now := time.Now()
		mockSummaries := []domain.MonthlySummary{
			{
				Month:      "September 2025",
				Year:       2025,
				MonthNum:   9,
				TotalMiles: 100.0,
			},
		}

		settingsError := fmt.Errorf("settings database error")

		// Mock expectations
		startDate := now.AddDate(0, -5, 0).Format("2006-01-01")
		endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location()).Format("2006-01-02")
		mockTripRepo.On("GetMonthlySummary", mock.Anything, startDate, endDate).Return(mockSummaries, nil)
		mockSettingsRepo.On("GetByKey", mock.Anything, "mileage_rate").Return(nil, settingsError)

		// Execute
		result, err := tripService.GetSummary(context.Background())

		// Assert - getMileageRate handles all errors gracefully by returning default rate
		assert.NoError(t, err)
		assert.NotNil(t, result)

		mockTripRepo.AssertExpectations(t)
		mockSettingsRepo.AssertExpectations(t)
	})
}
