package trip

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

// MockTripService implements the TripService interface for testing
type MockTripService struct {
	mock.Mock
}

func (m *MockTripService) CreateTrip(ctx context.Context, req domain.CreateTripRequest) (*domain.Trip, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Trip), args.Error(1)
}

func (m *MockTripService) UpdateTrip(ctx context.Context, id uint, req domain.UpdateTripRequest) (*domain.Trip, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Trip), args.Error(1)
}

func (m *MockTripService) DeleteTrip(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockTripService) GetTripByID(ctx context.Context, id uint) (*domain.Trip, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Trip), args.Error(1)
}

func (m *MockTripService) GetTrips(ctx context.Context, page, limit int, filters domain.TripFilters) ([]domain.Trip, int64, error) {
	args := m.Called(ctx, page, limit, filters)
	return args.Get(0).([]domain.Trip), args.Get(1).(int64), args.Error(2)
}

func (m *MockTripService) GetSummary(ctx context.Context) (*domain.SummaryResponse, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.SummaryResponse), args.Error(1)
}

func setupTestRouter(tripService *MockTripService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	handler := NewHandler(tripService)

	api := router.Group("/api/v1")
	{
		api.POST("/trips", handler.CreateTrip)
		api.GET("/trips", handler.GetTrips)
		api.GET("/trips/:id", handler.GetTripByID)
		api.PUT("/trips/:id", handler.UpdateTrip)
		api.DELETE("/trips/:id", handler.DeleteTrip)
		api.GET("/trips/summary", handler.GetSummary)
	}

	return router
}

func TestTripHandler_CreateTrip(t *testing.T) {
	mockService := new(MockTripService)
	router := setupTestRouter(mockService)

	t.Run("should create trip successfully", func(t *testing.T) {
		// Setup
		requestBody := domain.CreateTripRequest{
			ClientName: "Acme Corp",
			TripDate:   "2025-01-15",
			Miles:      125.5,
			Notes:      "Client meeting",
		}

		expectedTrip := &domain.Trip{
			ID:         1,
			ClientID:   func() *uint { id := uint(1); return &id }(),
			ClientName: "Acme Corp",
			TripDate:   "2025-01-15",
			Miles:      125.5,
			Notes:      "Client meeting",
		}

		mockService.On("CreateTrip", mock.Anything, requestBody).Return(expectedTrip, nil)

		// Execute
		jsonData, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("POST", "/api/v1/trips", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusCreated, w.Code)

		var response domain.Trip
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, expectedTrip.ID, response.ID)
		assert.Equal(t, expectedTrip.ClientName, response.ClientName)
		assert.Equal(t, expectedTrip.Miles, response.Miles)

		mockService.AssertExpectations(t)
	})

	t.Run("should return 400 for invalid JSON", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("POST", "/api/v1/trips", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid request data")
	})

	t.Run("should handle service error", func(t *testing.T) {
		// Setup
		requestBody := domain.CreateTripRequest{
			ClientName: "Test Client",
			TripDate:   "2025-01-15",
			Miles:      100.0,
			Notes:      "Test trip",
		}

		mockService.On("CreateTrip", mock.Anything, requestBody).Return(nil, fmt.Errorf("database error"))

		// Execute
		jsonData, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("POST", "/api/v1/trips", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		mockService.AssertExpectations(t)
	})
}

func TestTripHandler_GetTrips(t *testing.T) {
	t.Run("should get trips with default pagination", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		expectedTrips := []domain.Trip{
			{ID: 1, ClientName: "Acme Corp", Miles: 125.5},
			{ID: 2, ClientName: "Beta Inc", Miles: 75.0},
		}

		mockService.On("GetTrips", mock.Anything, 1, 10, domain.TripFilters{}).Return(expectedTrips, int64(2), nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, float64(2), response["total"])
		assert.Equal(t, float64(1), response["page"])
		assert.Equal(t, float64(10), response["limit"])
		assert.Equal(t, float64(1), response["total_pages"])

		mockService.AssertExpectations(t)
	})

	t.Run("should handle pagination parameters", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		expectedTrips := []domain.Trip{}
		mockService.On("GetTrips", mock.Anything, 2, 5, domain.TripFilters{}).Return(expectedTrips, int64(0), nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?page=2&limit=5", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle service error", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		mockService.On("GetTrips", mock.Anything, 1, 10, domain.TripFilters{}).Return([]domain.Trip{}, int64(0), fmt.Errorf("database error"))

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		mockService.AssertExpectations(t)
	})
}

func TestTripHandler_GetTripByID(t *testing.T) {
	mockService := new(MockTripService)
	router := setupTestRouter(mockService)

	t.Run("should get trip by ID successfully", func(t *testing.T) {
		// Setup
		expectedTrip := &domain.Trip{
			ID:         1,
			ClientName: "Acme Corp",
			Miles:      125.5,
		}

		mockService.On("GetTripByID", mock.Anything, uint(1)).Return(expectedTrip, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips/1", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response domain.Trip
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, expectedTrip.ID, response.ID)

		mockService.AssertExpectations(t)
	})

	t.Run("should return 400 for invalid ID", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips/invalid", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid trip ID")
	})

	t.Run("should return 404 for non-existent trip", func(t *testing.T) {
		// Setup
		mockService.On("GetTripByID", mock.Anything, uint(999)).Return(nil, fmt.Errorf("record not found"))

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips/999", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusNotFound, w.Code)

		mockService.AssertExpectations(t)
	})
}

func TestTripHandler_UpdateTrip(t *testing.T) {
	mockService := new(MockTripService)
	router := setupTestRouter(mockService)

	t.Run("should update trip successfully", func(t *testing.T) {
		// Setup
		requestBody := domain.UpdateTripRequest{
			ClientName: "Updated Corp",
			TripDate:   "2025-01-16",
			Miles:      150.0,
			Notes:      "Updated notes",
		}

		expectedTrip := &domain.Trip{
			ID:         1,
			ClientName: "Updated Corp",
			TripDate:   "2025-01-16",
			Miles:      150.0,
			Notes:      "Updated notes",
		}

		mockService.On("UpdateTrip", mock.Anything, uint(1), requestBody).Return(expectedTrip, nil)

		// Execute
		jsonData, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("PUT", "/api/v1/trips/1", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response domain.Trip
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, expectedTrip.ClientName, response.ClientName)

		mockService.AssertExpectations(t)
	})

	t.Run("should return 400 for invalid ID", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("PUT", "/api/v1/trips/invalid", bytes.NewBuffer([]byte("{}")))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestTripHandler_DeleteTrip(t *testing.T) {
	mockService := new(MockTripService)
	router := setupTestRouter(mockService)

	t.Run("should delete trip successfully", func(t *testing.T) {
		// Setup
		mockService.On("DeleteTrip", mock.Anything, uint(1)).Return(nil)

		// Execute
		req, _ := http.NewRequest("DELETE", "/api/v1/trips/1", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusNoContent, w.Code)
		assert.Empty(t, w.Body.String())

		mockService.AssertExpectations(t)
	})

	t.Run("should return 400 for invalid ID", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("DELETE", "/api/v1/trips/invalid", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("should handle service error", func(t *testing.T) {
		// Setup
		mockService.On("DeleteTrip", mock.Anything, uint(999)).Return(fmt.Errorf("record not found"))

		// Execute
		req, _ := http.NewRequest("DELETE", "/api/v1/trips/999", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		mockService.AssertExpectations(t)
	})
}

func TestTripHandler_GetSummary(t *testing.T) {
	t.Run("should get summary successfully", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		expectedSummary := &domain.SummaryResponse{
			Months: []domain.MonthlySummary{
				{
					Month:      "January 2025",
					Year:       2025,
					MonthNum:   1,
					TotalMiles: 145.5,
					Amount:     97.49,
				},
			},
		}

		mockService.On("GetSummary", mock.Anything).Return(expectedSummary, nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips/summary", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response domain.SummaryResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Len(t, response.Months, 1)
		assert.Equal(t, expectedSummary.Months[0].TotalMiles, response.Months[0].TotalMiles)

		mockService.AssertExpectations(t)
	})

	t.Run("should handle service error", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		mockService.On("GetSummary", mock.Anything).Return(nil, fmt.Errorf("database error"))

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips/summary", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		mockService.AssertExpectations(t)
	})
}

func TestTripHandler_GetTrips_WithFilters(t *testing.T) {
	t.Run("should handle search filter", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		expectedTrips := []domain.Trip{
			{ID: 1, ClientName: "Acme Corp", Miles: 125.5},
		}

		expectedFilters := domain.TripFilters{
			Search: "acme",
		}

		mockService.On("GetTrips", mock.Anything, 1, 10, expectedFilters).Return(expectedTrips, int64(1), nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?search=acme", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("should handle client filter", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		expectedTrips := []domain.Trip{
			{ID: 1, ClientName: "Beta Inc", Miles: 75.0},
		}

		expectedFilters := domain.TripFilters{
			Client: "Beta Inc",
		}

		mockService.On("GetTrips", mock.Anything, 1, 10, expectedFilters).Return(expectedTrips, int64(1), nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?client=Beta Inc", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("should handle date range filters", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		expectedTrips := []domain.Trip{}

		expectedFilters := domain.TripFilters{
			DateFrom: "2025-01-01",
			DateTo:   "2025-01-31",
		}

		mockService.On("GetTrips", mock.Anything, 1, 10, expectedFilters).Return(expectedTrips, int64(0), nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?date_from=2025-01-01&date_to=2025-01-31", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("should handle miles range filters", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		expectedTrips := []domain.Trip{}

		minMiles := 50.0
		maxMiles := 200.0
		expectedFilters := domain.TripFilters{
			MinMiles: &minMiles,
			MaxMiles: &maxMiles,
		}

		mockService.On("GetTrips", mock.Anything, 1, 10, expectedFilters).Return(expectedTrips, int64(0), nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?min_miles=50&max_miles=200", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("should handle combined filters", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		expectedTrips := []domain.Trip{}

		minMiles := 100.0
		expectedFilters := domain.TripFilters{
			Search:   "client",
			DateFrom: "2025-01-01",
			MinMiles: &minMiles,
		}

		mockService.On("GetTrips", mock.Anything, 1, 10, expectedFilters).Return(expectedTrips, int64(0), nil)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?search=client&date_from=2025-01-01&min_miles=100", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("should return error for invalid date format", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?date_from=invalid-date", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "date_from must be in YYYY-MM-DD format")
	})

	t.Run("should return error for invalid miles", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?min_miles=invalid", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "min_miles must be a non-negative number")
	})

	t.Run("should return error for negative miles", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?min_miles=-10", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "min_miles must be a non-negative number")
	})

	t.Run("should return error when min_miles > max_miles", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?min_miles=200&max_miles=100", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "min_miles cannot be greater than max_miles")
	})

	t.Run("should return error when date_from > date_to", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		// Execute
		req, _ := http.NewRequest("GET", "/api/v1/trips?date_from=2025-01-31&date_to=2025-01-01", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "date_from cannot be after date_to")
	})

	t.Run("should trim whitespace from filters", func(t *testing.T) {
		// Setup
		mockService := new(MockTripService)
		router := setupTestRouter(mockService)

		expectedTrips := []domain.Trip{}

		expectedFilters := domain.TripFilters{
			Search: "test",
			Client: "Acme Corp",
		}

		mockService.On("GetTrips", mock.Anything, 1, 10, expectedFilters).Return(expectedTrips, int64(0), nil)

		// Execute - with extra whitespace
		req, _ := http.NewRequest("GET", "/api/v1/trips?search= test &client= Acme Corp ", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})
}
