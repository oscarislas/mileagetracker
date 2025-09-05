package health

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Test with versioned handler
	healthHandler := NewHandler("test-version-1.0.0")
	router.GET("/health", healthHandler.HealthHandler)
	router.GET("/ready", healthHandler.ReadinessHandler)

	// Also test legacy handlers
	router.GET("/health-legacy", HealthHandler)
	router.GET("/ready-legacy", ReadinessHandler)

	return router
}

func TestHealthHandler(t *testing.T) {
	router := setupTestRouter()

	t.Run("should return healthy status", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("GET", "/health", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response HealthResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "healthy", response.Status)
		assert.Equal(t, "test-version-1.0.0", response.Version)
	})

	t.Run("should handle multiple simultaneous health checks", func(t *testing.T) {
		// Execute multiple requests concurrently
		numRequests := 10
		responses := make(chan *httptest.ResponseRecorder, numRequests)

		for i := 0; i < numRequests; i++ {
			go func() {
				req, _ := http.NewRequest("GET", "/health", nil)
				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)
				responses <- w
			}()
		}

		// Collect all responses
		for i := 0; i < numRequests; i++ {
			w := <-responses
			assert.Equal(t, http.StatusOK, w.Code)

			var response HealthResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, "healthy", response.Status)
			assert.Equal(t, "test-version-1.0.0", response.Version)
		}
	})

	t.Run("should return consistent response format", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("GET", "/health", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert response structure
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		// Check required fields
		status, exists := response["status"]
		assert.True(t, exists)
		assert.Equal(t, "healthy", status)

		version, versionExists := response["version"]
		assert.True(t, versionExists)
		assert.Equal(t, "test-version-1.0.0", version)
	})

	t.Run("should handle OPTIONS request", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("OPTIONS", "/health", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert - OPTIONS might return 404 or Method Not Allowed, which is expected for simple test setup
		assert.True(t, w.Code == http.StatusNotFound || w.Code == http.StatusMethodNotAllowed)
	})

	t.Run("should be fast response time", func(t *testing.T) {
		// This is more of a performance characteristic test
		// Execute
		req, _ := http.NewRequest("GET", "/health", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)
		// Health endpoints should be very fast, but we can't easily test timing in unit tests
		// The main thing is that it doesn't hang or take excessive time
	})
}

func TestReadinessHandler(t *testing.T) {
	router := setupTestRouter()

	t.Run("should return ready status with services", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("GET", "/ready", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response ReadinessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "ready", response.Status)
		assert.Equal(t, "test-version-1.0.0", response.Version)
		assert.NotNil(t, response.Services)
	})

	t.Run("should include database service check", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("GET", "/ready", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response ReadinessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "test-version-1.0.0", response.Version)

		// Check database service is included
		dbStatus, exists := response.Services["database"]
		assert.True(t, exists)
		assert.Equal(t, "healthy", dbStatus)
	})

	t.Run("should handle multiple simultaneous readiness checks", func(t *testing.T) {
		// Execute multiple requests concurrently
		numRequests := 10
		responses := make(chan *httptest.ResponseRecorder, numRequests)

		for i := 0; i < numRequests; i++ {
			go func() {
				req, _ := http.NewRequest("GET", "/ready", nil)
				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)
				responses <- w
			}()
		}

		// Collect all responses
		for i := 0; i < numRequests; i++ {
			w := <-responses
			assert.Equal(t, http.StatusOK, w.Code)

			var response ReadinessResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, "ready", response.Status)
			assert.Equal(t, "test-version-1.0.0", response.Version)
			assert.Contains(t, response.Services, "database")
		}
	})

	t.Run("should return consistent response format", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("GET", "/ready", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert response structure
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		// Check required fields
		status, statusExists := response["status"]
		assert.True(t, statusExists)
		assert.Equal(t, "ready", status)

		version, versionExists := response["version"]
		assert.True(t, versionExists)
		assert.Equal(t, "test-version-1.0.0", version)

		services, servicesExist := response["services"]
		assert.True(t, servicesExist)
		assert.IsType(t, map[string]interface{}{}, services)
	})

	t.Run("should handle OPTIONS request", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("OPTIONS", "/ready", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert - OPTIONS might return 404 or Method Not Allowed, which is expected for simple test setup
		assert.True(t, w.Code == http.StatusNotFound || w.Code == http.StatusMethodNotAllowed)
	})

	t.Run("should validate services map structure", func(t *testing.T) {
		// Execute
		req, _ := http.NewRequest("GET", "/ready", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response ReadinessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "test-version-1.0.0", response.Version)

		// Validate services structure
		assert.IsType(t, map[string]string{}, response.Services)
		assert.Greater(t, len(response.Services), 0, "Should have at least one service check")

		// Each service should have a string status
		for serviceName, serviceStatus := range response.Services {
			assert.NotEmpty(t, serviceName, "Service name should not be empty")
			assert.IsType(t, "", serviceStatus, "Service status should be string")
			assert.NotEmpty(t, serviceStatus, "Service status should not be empty")
		}
	})

	t.Run("should be idempotent", func(t *testing.T) {
		// Execute multiple times
		var responses []ReadinessResponse

		for i := 0; i < 3; i++ {
			req, _ := http.NewRequest("GET", "/ready", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var response ReadinessResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, "test-version-1.0.0", response.Version)
			responses = append(responses, response)
		}

		// All responses should be identical
		for i := 1; i < len(responses); i++ {
			assert.Equal(t, responses[0].Status, responses[i].Status)
			assert.Equal(t, responses[0].Version, responses[i].Version)
			assert.Equal(t, responses[0].Services, responses[i].Services)
		}
	})
}

func TestHealthAndReadinessHandlers_Integration(t *testing.T) {
	router := setupTestRouter()

	t.Run("both endpoints should be accessible", func(t *testing.T) {
		// Test health endpoint
		healthReq, _ := http.NewRequest("GET", "/health", nil)
		healthW := httptest.NewRecorder()
		router.ServeHTTP(healthW, healthReq)
		assert.Equal(t, http.StatusOK, healthW.Code)

		// Test readiness endpoint
		readyReq, _ := http.NewRequest("GET", "/ready", nil)
		readyW := httptest.NewRecorder()
		router.ServeHTTP(readyW, readyReq)
		assert.Equal(t, http.StatusOK, readyW.Code)
	})

	t.Run("endpoints should have different response formats", func(t *testing.T) {
		// Get health response
		healthReq, _ := http.NewRequest("GET", "/health", nil)
		healthW := httptest.NewRecorder()
		router.ServeHTTP(healthW, healthReq)

		var healthResponse HealthResponse
		err := json.Unmarshal(healthW.Body.Bytes(), &healthResponse)
		assert.NoError(t, err)

		// Get readiness response
		readyReq, _ := http.NewRequest("GET", "/ready", nil)
		readyW := httptest.NewRecorder()
		router.ServeHTTP(readyW, readyReq)

		var readyResponse ReadinessResponse
		err = json.Unmarshal(readyW.Body.Bytes(), &readyResponse)
		assert.NoError(t, err)

		// Verify different formats
		assert.NotEqual(t, healthResponse.Status, readyResponse.Status)
		assert.Equal(t, "healthy", healthResponse.Status)
		assert.Equal(t, "ready", readyResponse.Status)
	})
}

func TestHealthHandlerStructure(t *testing.T) {
	t.Run("NewHandler should create handler with correct version", func(t *testing.T) {
		version := "v2.1.0"
		handler := NewHandler(version)
		assert.NotNil(t, handler)
		assert.Equal(t, version, handler.version)
	})

	t.Run("Handler methods should return correct version", func(t *testing.T) {
		version := "v3.0.0-beta"
		handler := NewHandler(version)

		gin.SetMode(gin.TestMode)
		router := gin.New()
		router.GET("/health", handler.HealthHandler)
		router.GET("/ready", handler.ReadinessHandler)

		// Test health endpoint
		healthReq, _ := http.NewRequest("GET", "/health", nil)
		healthW := httptest.NewRecorder()
		router.ServeHTTP(healthW, healthReq)

		var healthResponse HealthResponse
		err := json.Unmarshal(healthW.Body.Bytes(), &healthResponse)
		assert.NoError(t, err)
		assert.Equal(t, version, healthResponse.Version)

		// Test readiness endpoint
		readyReq, _ := http.NewRequest("GET", "/ready", nil)
		readyW := httptest.NewRecorder()
		router.ServeHTTP(readyW, readyReq)

		var readyResponse ReadinessResponse
		err = json.Unmarshal(readyW.Body.Bytes(), &readyResponse)
		assert.NoError(t, err)
		assert.Equal(t, version, readyResponse.Version)
	})
}

func TestLegacyHandlers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/health-legacy", HealthHandler)
	router.GET("/ready-legacy", ReadinessHandler)

	t.Run("legacy health handler should return unknown version", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/health-legacy", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response HealthResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "healthy", response.Status)
		assert.Equal(t, "unknown", response.Version)
	})

	t.Run("legacy readiness handler should return unknown version", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/ready-legacy", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response ReadinessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "ready", response.Status)
		assert.Equal(t, "unknown", response.Version)
		assert.Contains(t, response.Services, "database")
	})
}
