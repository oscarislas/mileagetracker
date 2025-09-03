package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockClientService implements the ClientService interface for testing
type MockClientService struct {
	mock.Mock
}

func (m *MockClientService) GetOrCreateClient(ctx context.Context, name string) (*domain.Client, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Client), args.Error(1)
}

func (m *MockClientService) GetSuggestions(ctx context.Context, query string) ([]domain.Client, error) {
	args := m.Called(ctx, query)
	return args.Get(0).([]domain.Client), args.Error(1)
}

func setupTestRouter(clientService *MockClientService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	handler := NewHandler(clientService)
	
	api := router.Group("/api/v1")
	{
		api.GET("/clients/suggestions", handler.GetSuggestions)
	}
	
	return router
}

func TestClientHandler_GetSuggestions(t *testing.T) {
	mockService := new(MockClientService)
	router := setupTestRouter(mockService)

	t.Run("should return client suggestions successfully", func(t *testing.T) {
		// Setup
		expectedClients := []domain.Client{
			{ID: 1, Name: "Acme Corp"},
			{ID: 2, Name: "Acme Industries"},
			{ID: 3, Name: "Acme Solutions"},
		}
		
		mockService.On("GetSuggestions", mock.Anything, "acme").Return(expectedClients, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/clients/suggestions?q=acme", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		clients, ok := response["clients"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, clients, 3)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle empty query parameter", func(t *testing.T) {
		// Setup
		expectedClients := []domain.Client{}
		mockService.On("GetSuggestions", mock.Anything, "").Return(expectedClients, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/clients/suggestions", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		clients, ok := response["clients"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, clients, 0)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle query with whitespace", func(t *testing.T) {
		// Setup
		expectedClients := []domain.Client{
			{ID: 1, Name: "Beta Inc"},
		}
		
		mockService.On("GetSuggestions", mock.Anything, "  beta  ").Return(expectedClients, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/clients/suggestions?q=  beta  ", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		clients, ok := response["clients"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, clients, 1)

		mockService.AssertExpectations(t)
	})

	t.Run("should return no suggestions for unmatched query", func(t *testing.T) {
		// Setup
		expectedClients := []domain.Client{}
		mockService.On("GetSuggestions", mock.Anything, "nonexistent").Return(expectedClients, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/clients/suggestions?q=nonexistent", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		clients, ok := response["clients"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, clients, 0)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle special characters in query", func(t *testing.T) {
		// Setup
		queryWithSpecialChars := "acme & co."
		expectedClients := []domain.Client{
			{ID: 1, Name: "Acme & Co."},
		}
		
		mockService.On("GetSuggestions", mock.Anything, queryWithSpecialChars).Return(expectedClients, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/clients/suggestions?q=acme%20%26%20co.", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		clients, ok := response["clients"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, clients, 1)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle service error", func(t *testing.T) {
		// Setup
		mockService.On("GetSuggestions", mock.Anything, "error").Return([]domain.Client{}, fmt.Errorf("database connection failed"))

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/clients/suggestions?q=error", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle case-sensitive query correctly", func(t *testing.T) {
		// Setup
		expectedClients := []domain.Client{
			{ID: 1, Name: "ACME Corporation"},
		}
		
		mockService.On("GetSuggestions", mock.Anything, "ACME").Return(expectedClients, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/clients/suggestions?q=ACME", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		clients, ok := response["clients"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, clients, 1)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle long query strings", func(t *testing.T) {
		// Setup
		longQuery := "this is a very long client name that might be used for testing purposes and edge cases"
		expectedClients := []domain.Client{}
		
		mockService.On("GetSuggestions", mock.Anything, longQuery).Return(expectedClients, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/clients/suggestions?q="+longQuery, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		clients, ok := response["clients"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, clients, 0)

		mockService.AssertExpectations(t)
	})

	t.Run("should return maximum suggestions when many matches exist", func(t *testing.T) {
		// Setup - simulating the service limit of 10 suggestions
		expectedClients := []domain.Client{}
		for i := 1; i <= 10; i++ {
			expectedClients = append(expectedClients, domain.Client{
				ID:   uint(i),
				Name: fmt.Sprintf("Client %d", i),
			})
		}
		
		mockService.On("GetSuggestions", mock.Anything, "client").Return(expectedClients, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/clients/suggestions?q=client", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		clients, ok := response["clients"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, clients, 10) // Should be limited to 10 suggestions

		mockService.AssertExpectations(t)
	})
}