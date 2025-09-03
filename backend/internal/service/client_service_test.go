package service

import (
	"context"
	"fmt"
	"strings"
	"testing"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

func TestClientService_GetOrCreateClient(t *testing.T) {

	t.Run("should return existing client", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)

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
		clientService := NewClientService(mockClientRepo)

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
		clientService := NewClientService(mockClientRepo)

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
		clientService := NewClientService(mockClientRepo)

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
		clientService := NewClientService(mockClientRepo)
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
		clientService := NewClientService(mockClientRepo)
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
		clientService := NewClientService(mockClientRepo)

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
		clientService := NewClientService(mockClientRepo)

		// Execute
		result, err := clientService.GetSuggestions(context.Background(), "")

		// Assert
		assert.NoError(t, err)
		assert.Len(t, result, 0)
	})

	t.Run("should return empty slice for whitespace-only query", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)

		// Execute
		result, err := clientService.GetSuggestions(context.Background(), "   ")

		// Assert
		assert.NoError(t, err)
		assert.Len(t, result, 0)
	})

	t.Run("should handle database error", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)
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

	t.Run("should handle very long query", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)
		longQuery := strings.Repeat("a", 1000) // 1000 character query

		expectedClients := []domain.Client{
			{ID: 1, Name: "AAAA Company"},
		}

		// Mock expectations
		mockClientRepo.On("GetSuggestions", mock.Anything, longQuery, 10).Return(expectedClients, nil)

		// Execute
		result, err := clientService.GetSuggestions(context.Background(), longQuery)

		// Assert
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, expectedClients[0].Name, result[0].Name)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should handle query with special characters", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)
		specialQuery := "Acme & Co's 100% \"Best\" Corp!"

		expectedClients := []domain.Client{
			{ID: 1, Name: "Acme & Co's 100% \"Best\" Corp!"},
		}

		// Mock expectations
		mockClientRepo.On("GetSuggestions", mock.Anything, specialQuery, 10).Return(expectedClients, nil)

		// Execute
		result, err := clientService.GetSuggestions(context.Background(), specialQuery)

		// Assert
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, expectedClients[0].Name, result[0].Name)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should return empty result when repository returns empty array", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)

		// Mock expectations
		mockClientRepo.On("GetSuggestions", mock.Anything, "nonexistent", 10).Return([]domain.Client{}, nil)

		// Execute
		result, err := clientService.GetSuggestions(context.Background(), "nonexistent")

		// Assert
		assert.NoError(t, err)
		assert.Empty(t, result)

		mockClientRepo.AssertExpectations(t)
	})
}

func TestClientService_GetOrCreateClient_EdgeCases(t *testing.T) {

	t.Run("should handle very long client names", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)
		longName := strings.Repeat("A", 255) // Very long name

		// Mock expectations
		mockClientRepo.On("FindByName", mock.Anything, longName).Return(nil, gorm.ErrRecordNotFound)
		mockClientRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Client")).Return(nil).Run(func(args mock.Arguments) {
			client := args.Get(1).(*domain.Client)
			client.ID = 1
		})

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), longName)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, longName, result.Name)
		assert.Equal(t, uint(1), result.ID)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should handle client names with special characters", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)
		specialName := "Acme & Co's 100% \"Best\" Corp! (Est. 2020)"

		expectedClient := &domain.Client{
			ID:   1,
			Name: specialName,
		}

		// Mock expectations
		mockClientRepo.On("FindByName", mock.Anything, specialName).Return(expectedClient, nil)

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), specialName)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, specialName, result.Name)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should handle client names with unicode characters", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)
		unicodeName := "Müller & Assøciés Corp 北京公司"

		// Mock expectations
		mockClientRepo.On("FindByName", mock.Anything, unicodeName).Return(nil, gorm.ErrRecordNotFound)
		mockClientRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Client")).Return(nil).Run(func(args mock.Arguments) {
			client := args.Get(1).(*domain.Client)
			client.ID = 2
		})

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), unicodeName)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, unicodeName, result.Name)
		assert.Equal(t, uint(2), result.ID)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should handle client names with only whitespace variations", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)

		testCases := []string{
			"   ",      // spaces
			"\t\t",     // tabs
			"\n\n",     // newlines
			"\r\n\r\n", // carriage returns
			" \t\n\r ", // mixed whitespace
		}

		for _, testName := range testCases {
			t.Run(fmt.Sprintf("whitespace: %q", testName), func(t *testing.T) {
				// Execute
				result, err := clientService.GetOrCreateClient(context.Background(), testName)

				// Assert
				assert.Error(t, err)
				assert.Nil(t, result)
				assert.Equal(t, gorm.ErrRecordNotFound, err)
			})
		}
	})

	t.Run("should trim leading and trailing whitespace from valid names", func(t *testing.T) {
		// Setup
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)
		paddedName := "  Valid Client Name  "
		trimmedName := "Valid Client Name"

		expectedClient := &domain.Client{
			ID:   1,
			Name: trimmedName,
		}

		// Mock expectations - should look for trimmed name
		mockClientRepo.On("FindByName", mock.Anything, trimmedName).Return(expectedClient, nil)

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), paddedName)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, trimmedName, result.Name)

		mockClientRepo.AssertExpectations(t)
	})

	t.Run("should handle concurrent access scenarios", func(t *testing.T) {
		// This test simulates a race condition where another process creates
		// the client between the FindByName and Create calls
		mockClientRepo := new(MockClientRepository)
		clientService := NewClientService(mockClientRepo)
		clientName := "Concurrent Client"

		// Mock expectations - simulate race condition
		mockClientRepo.On("FindByName", mock.Anything, clientName).Return(nil, gorm.ErrRecordNotFound).Once()
		mockClientRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Client")).Return(gorm.ErrDuplicatedKey).Once()

		// Execute
		result, err := clientService.GetOrCreateClient(context.Background(), clientName)

		// For this test, we expect the current implementation to fail with duplicate key error
		// This represents the current behavior - in a production system you might want
		// to handle this race condition by retrying the FindByName operation
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, gorm.ErrDuplicatedKey, err)

		mockClientRepo.AssertExpectations(t)
	})
}
