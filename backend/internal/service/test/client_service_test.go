package service_test

import (
	"context"
	"testing"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/oscar/mileagetracker/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

func TestClientService_GetOrCreateClient(t *testing.T) {

	t.Run("should return existing client", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)

		expectedClient := &domain.Client{
			ID:   1,
			Name: "Existing Client",
		}

		// Mock expectations
		mockClientRepo.On("FindByName", mock.Anything, "Existing Client").Return(expectedClient, nil)

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), "Existing Client")

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, expectedClient.ID, result.ID)
		assert.Equal(t, expectedClient.Name, result.Name)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should create new client when not found", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)

		// Mock expectations
		mockClientRepo.On("FindByName", mock.Anything, "New Client").Return(nil, gorm.ErrRecordNotFound)
		mockClientRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Client")).Return(nil).Run(func(args mock.Arguments) {
			client := args.Get(1).(*domain.Client)
			client.ID = 2 // Simulate database assigning ID
		})

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), "New Client")

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, uint(2), result.ID)
		assert.Equal(t, "New Client", result.Name)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should return error for empty name", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), "")

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})

	t.Run("should return error for whitespace-only name", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), "   ")

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})

	t.Run("should handle database error during creation", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)
		dbError := gorm.ErrInvalidDB

		// Mock expectations
		mockClientRepo.On("FindByName", mock.Anything, "Test Client").Return(nil, gorm.ErrRecordNotFound)
		mockClientRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Client")).Return(dbError)

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), "Test Client")

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, dbError, err)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should handle unexpected database error during lookup", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)
		dbError := gorm.ErrInvalidDB

		// Mock expectations
		mockClientRepo.On("FindByName", mock.Anything, "Test Client").Return(nil, dbError)

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), "Test Client")

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, dbError, err)

		mockClientRepo.AssertExpectations(t)
	})
}

// MockClientRepository implements the ClientRepository interface for testing
type MockClientRepository struct {
	mock.Mock
}

func (m *MockClientRepository) Create(ctx context.Context, client *domain.Client) error {
	args := m.Called(ctx, client)
	return args.Error(0)
}

func (m *MockClientRepository) FindByName(ctx context.Context, name string) (*domain.Client, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Client), args.Error(1)
}

func (m *MockClientRepository) GetSuggestions(ctx context.Context, query string, limit int) ([]domain.Client, error) {
	args := m.Called(ctx, query, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.Client), args.Error(1)
}

func TestClientService_GetSuggestions(t *testing.T) {

	t.Run("should return suggestions for valid query", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)

		expectedClients := []domain.Client{
			{ID: 1, Name: "Acme Corp"},
			{ID: 2, Name: "ABC Company"},
		}

		// Mock expectations
		mockClientRepo.On("GetSuggestions", mock.Anything, "Ac", 10).Return(expectedClients, nil)

		// Execute
		result, err := clientService.GetSuggestions(context.Background(), "Ac")

		// Assert
		assert.NoError(t, err)
		assert.Len(t, result, 2)
		assert.Equal(t, expectedClients[0].Name, result[0].Name)
		assert.Equal(t, expectedClients[1].Name, result[1].Name)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should return empty slice for empty query", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)

		// Execute
		result, err := clientService.GetSuggestions(context.Background(), "")

		// Assert
		assert.NoError(t, err)
		assert.Len(t, result, 0)
	})

	t.Run("should return empty slice for whitespace-only query", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)

		// Execute
		result, err := clientService.GetSuggestions(context.Background(), "   ")

		// Assert
		assert.NoError(t, err)
		assert.Len(t, result, 0)
	})

	t.Run("should handle database error", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := service.NewClientService(mockClientRepo)
		dbError := gorm.ErrInvalidDB

		// Mock expectations
		mockClientRepo.On("GetSuggestions", mock.Anything, "test", 10).Return(nil, dbError)

		// Execute
		result, err := clientService.GetSuggestions(context.Background(), "test")

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, dbError, err)

		mockClientRepo.AssertExpectations(t)
	})
}
