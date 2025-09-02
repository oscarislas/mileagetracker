package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/oscar/mileagetracker/internal/api/date"
	"github.com/oscar/mileagetracker/internal/api/health"
	"github.com/oscar/mileagetracker/internal/api/middleware"
	"github.com/oscar/mileagetracker/internal/config"
	"github.com/oscar/mileagetracker/internal/logger"
)

func main() {
	cfg := config.Load()

	if err := logger.Init(cfg.Logger.Level); err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err))
	}
	defer logger.Sync()

	logger.Info("Starting Mileage Tracker API", zap.String("version", "1.0.0"))

	gin.SetMode(cfg.Server.Mode)
	router := gin.New()

	router.Use(gin.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())

	setupRoutes(router)

	server := &http.Server{
		Addr:         ":" + strconv.Itoa(cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	go func() {
		logger.Info("Server starting", zap.Int("port", cfg.Server.Port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("Failed to start server", zap.Error(err))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Server shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", zap.Error(err))
		os.Exit(1)
	}

	logger.Info("Server exited")
}

func setupRoutes(router *gin.Engine) {
	router.GET("/health", health.HealthHandler)
	router.GET("/ready", health.ReadinessHandler)

	v1 := router.Group("/api/v1")
	{
		v1.GET("/date", date.DateHandler)
	}
}