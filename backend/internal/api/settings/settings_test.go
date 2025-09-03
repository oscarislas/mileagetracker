package settings

import (
	"bytes"
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

// MockSettingsService implements the SettingsService interface for testing
type MockSettingsService struct {
	mock.Mock
}

func (m *MockSettingsService) GetSettings(ctx context.Context) (*domain.SettingsResponse, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.SettingsResponse), args.Error(1)
}

func (m *MockSettingsService) UpdateSettings(ctx context.Context, req domain.UpdateSettingsRequest) (*domain.SettingsResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.SettingsResponse), args.Error(1)
}

func setupTestRouter(settingsService *MockSettingsService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	handler := NewHandler(settingsService)

	api := router.Group("/api/v1")
	{
		api.GET("/settings", handler.GetSettings)
		api.PUT("/settings", handler.UpdateSettings)
	}

	return router
}

func TestSettingsHandler_GetSettings(t *testing.T) {
	t.Run("should get settings successfully", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		expectedSettings := &domain.SettingsResponse{
			MileageRate: 0.67,
		}

		mockService.On("GetSettings", mock.Anything).Return(expectedSettings, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/settings", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response domain.SettingsResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, expectedSettings.MileageRate, response.MileageRate)

		mockService.AssertExpectations(t)
	})

	t.Run("should get default settings when none exist", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		expectedSettings := &domain.SettingsResponse{
			MileageRate: 0.67,
		}

		mockService.On("GetSettings", mock.Anything).Return(expectedSettings, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/settings", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response domain.SettingsResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, 0.67, response.MileageRate)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle service error", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		mockService.On("GetSettings", mock.Anything).Return(nil, fmt.Errorf("database connection failed"))

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/settings", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		mockService.AssertExpectations(t)
	})

	t.Run("should return custom mileage rate", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		expectedSettings := &domain.SettingsResponse{
			MileageRate: 0.58,
		}

		mockService.On("GetSettings", mock.Anything).Return(expectedSettings, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/settings", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response domain.SettingsResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, 0.58, response.MileageRate)

		mockService.AssertExpectations(t)
	})
}

func TestSettingsHandler_UpdateSettings(t *testing.T) {
	t.Run("should update settings successfully", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		requestBody := domain.UpdateSettingsRequest{
			MileageRate: 0.58,
		}

		expectedSettings := &domain.SettingsResponse{
			MileageRate: 0.58,
		}

		mockService.On("UpdateSettings", mock.Anything, requestBody).Return(expectedSettings, nil)

		// Execute
		jsonData, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response domain.SettingsResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, expectedSettings.MileageRate, response.MileageRate)

		mockService.AssertExpectations(t)
	})

	t.Run("should update settings with high precision rate", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		requestBody := domain.UpdateSettingsRequest{
			MileageRate: 0.655,
		}

		expectedSettings := &domain.SettingsResponse{
			MileageRate: 0.655,
		}

		mockService.On("UpdateSettings", mock.Anything, requestBody).Return(expectedSettings, nil)

		// Execute
		jsonData, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response domain.SettingsResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, 0.655, response.MileageRate)

		mockService.AssertExpectations(t)
	})

	t.Run("should return 400 for invalid JSON", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		// Execute
		req, _ := http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid request data")
	})

	t.Run("should return 400 for missing required field", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		// Execute
		req, _ := http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer([]byte("{}")))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid request data")
	})

	t.Run("should return 400 for negative mileage rate", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		// Execute
		jsonData := []byte(`{"mileage_rate": -0.5}`)
		req, _ := http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid request data")
	})

	t.Run("should return 400 for invalid data type", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		// Execute
		jsonData := []byte(`{"mileage_rate": "invalid"}`)
		req, _ := http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid request data")
	})

	t.Run("should handle service error", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		requestBody := domain.UpdateSettingsRequest{
			MileageRate: 0.58,
		}

		mockService.On("UpdateSettings", mock.Anything, requestBody).Return(nil, fmt.Errorf("validation error"))

		// Execute
		jsonData, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid request data")

		mockService.AssertExpectations(t)
	})

	t.Run("should handle very large mileage rate", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		requestBody := domain.UpdateSettingsRequest{
			MileageRate: 999.99,
		}

		expectedSettings := &domain.SettingsResponse{
			MileageRate: 999.99,
		}

		mockService.On("UpdateSettings", mock.Anything, requestBody).Return(expectedSettings, nil)

		// Execute
		jsonData, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response domain.SettingsResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, 999.99, response.MileageRate)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle request without content-type header", func(t *testing.T) {
		// Setup
		mockService := new(MockSettingsService)
		router := setupTestRouter(mockService)

		requestBody := domain.UpdateSettingsRequest{
			MileageRate: 0.58,
		}

		expectedSettings := &domain.SettingsResponse{
			MileageRate: 0.58,
		}

		mockService.On("UpdateSettings", mock.Anything, requestBody).Return(expectedSettings, nil)

		// Execute
		jsonData := []byte(`{"mileage_rate": 0.58}`)
		req, _ := http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(jsonData))
		// Intentionally omit Content-Type header - Gin should still parse JSON

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert - should still work as Gin is flexible with JSON parsing
		assert.Equal(t, http.StatusOK, w.Code)

		mockService.AssertExpectations(t)
	})
}
