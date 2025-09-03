package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/oscar/mileagetracker/internal/logger"
	"github.com/stretchr/testify/assert"
)

func TestCORS(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("should set CORS headers", func(t *testing.T) {
		router := gin.New()
		router.Use(CORS())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "ok"})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Check CORS headers are set
		assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Headers"), "Content-Type")
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Headers"), "Authorization")
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "GET")
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "POST")
		assert.Equal(t, 200, w.Code)
	})

	t.Run("should handle OPTIONS request", func(t *testing.T) {
		router := gin.New()
		router.Use(CORS())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "ok"})
		})

		req, _ := http.NewRequest("OPTIONS", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// OPTIONS should return 204 and not call next handler
		assert.Equal(t, 204, w.Code)
		assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Empty(t, w.Body.String()) // Should be empty body
	})

	t.Run("should allow all HTTP methods", func(t *testing.T) {
		methods := []string{"GET", "POST", "PUT", "DELETE", "PATCH"}

		for _, method := range methods {
			router := gin.New()
			router.Use(CORS())
			router.Any("/test", func(c *gin.Context) {
				c.JSON(200, gin.H{"method": method})
			})

			req, _ := http.NewRequest(method, "/test", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			allowedMethods := w.Header().Get("Access-Control-Allow-Methods")
			assert.Contains(t, allowedMethods, method, "Method %s should be allowed", method)
		}
	})
}

func TestLogger(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Initialize logger for testing
	err := logger.Init("debug")
	if err != nil {
		t.Fatalf("Failed to initialize logger: %v", err)
	}

	t.Run("should log HTTP requests", func(t *testing.T) {
		router := gin.New()
		router.Use(Logger())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "ok"})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		// Logger middleware should not affect the response
		assert.Contains(t, w.Body.String(), "ok")
	})

	t.Run("should log requests with query parameters", func(t *testing.T) {
		router := gin.New()
		router.Use(Logger())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(200, gin.H{"query": c.Query("param")})
		})

		req, _ := http.NewRequest("GET", "/test?param=value&other=test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		assert.Contains(t, w.Body.String(), "value")
	})

	t.Run("should log different HTTP methods", func(t *testing.T) {
		methods := []string{"GET", "POST", "PUT", "DELETE"}

		for _, method := range methods {
			router := gin.New()
			router.Use(Logger())
			router.Any("/test", func(c *gin.Context) {
				c.JSON(200, gin.H{"method": c.Request.Method})
			})

			req, _ := http.NewRequest(method, "/test", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, 200, w.Code)
			// Logger should not interfere with the request processing
		}
	})

	t.Run("should log different status codes", func(t *testing.T) {
		testCases := []struct {
			path       string
			statusCode int
		}{
			{"/success", 200},
			{"/created", 201},
			{"/bad-request", 400},
			{"/not-found", 404},
			{"/error", 500},
		}

		for _, tc := range testCases {
			router := gin.New()
			router.Use(Logger())
			router.GET(tc.path, func(c *gin.Context) {
				c.JSON(tc.statusCode, gin.H{"status": tc.statusCode})
			})

			req, _ := http.NewRequest("GET", tc.path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tc.statusCode, w.Code)
		}
	})

	t.Run("should capture request timing", func(t *testing.T) {
		router := gin.New()
		router.Use(Logger())
		router.GET("/slow", func(c *gin.Context) {
			// Simulate some processing time
			// In real scenarios, this would be actual business logic
			c.JSON(200, gin.H{"message": "processed"})
		})

		req, _ := http.NewRequest("GET", "/slow", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		// The logger captures timing information but we can't easily test the logged output
		// This test ensures the middleware doesn't crash or interfere with timing
	})
}

func TestMiddlewareIntegration(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Initialize logger for integration testing
	err := logger.Init("debug")
	if err != nil {
		t.Fatalf("Failed to initialize logger: %v", err)
	}

	t.Run("should work together CORS and Logger middleware", func(t *testing.T) {
		router := gin.New()
		router.Use(Logger())
		router.Use(CORS())
		router.GET("/api/test", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "success",
				"method":  c.Request.Method,
			})
		})

		req, _ := http.NewRequest("GET", "/api/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Both middleware should work
		assert.Equal(t, 200, w.Code)
		assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Contains(t, w.Body.String(), "success")
	})

	t.Run("should handle OPTIONS with both middleware", func(t *testing.T) {
		router := gin.New()
		router.Use(Logger())
		router.Use(CORS())
		router.GET("/api/test", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "should not reach here"})
		})

		req, _ := http.NewRequest("OPTIONS", "/api/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// CORS should handle OPTIONS and return 204
		assert.Equal(t, 204, w.Code)
		assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Empty(t, w.Body.String())
	})
}
