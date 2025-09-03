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

	"github.com/oscar/mileagetracker/internal/api/client"
	"github.com/oscar/mileagetracker/internal/api/health"
	"github.com/oscar/mileagetracker/internal/api/middleware"
	"github.com/oscar/mileagetracker/internal/api/settings"
	"github.com/oscar/mileagetracker/internal/api/trip"
	"github.com/oscar/mileagetracker/internal/config"
	"github.com/oscar/mileagetracker/internal/database"
	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/oscar/mileagetracker/internal/logger"
	"github.com/oscar/mileagetracker/internal/repository"
	"github.com/oscar/mileagetracker/internal/service"
)

func main() {
	cfg := config.Load()

	if err := logger.Init(cfg.Logger.Level); err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err))
	}
	defer logger.Sync()

	logger.Info("Starting Mileage Tracker API", zap.String("version", "1.0.0"))

	// Initialize database
	if err := database.Init(&cfg.Database); err != nil {
		logger.Error("Failed to initialize database", zap.Error(err))
		panic(fmt.Sprintf("Failed to initialize database: %v", err))
	}
	defer database.Close()

	// Auto-migrate database schema
	if err := database.DB.AutoMigrate(
		&domain.Client{},
		&domain.Trip{},
		&domain.Settings{},
	); err != nil {
		logger.Error("Failed to migrate database", zap.Error(err))
		panic(fmt.Sprintf("Failed to migrate database: %v", err))
	}

	// Initialize repositories
	clientRepo := repository.NewClientRepository(database.DB)
	tripRepo := repository.NewTripRepository(database.DB)
	settingsRepo := repository.NewSettingsRepository(database.DB)

	// Initialize services
	clientService := service.NewClientService(clientRepo)
	tripService := service.NewTripService(tripRepo, clientService, settingsRepo)
	settingsService := service.NewSettingsService(settingsRepo)

	// Initialize handlers
	clientHandler := client.NewHandler(clientService)
	tripHandler := trip.NewHandler(tripService)
	settingsHandler := settings.NewHandler(settingsService)

	gin.SetMode(cfg.Server.Mode)
	router := gin.New()

	router.Use(gin.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())

	setupRoutes(router, clientHandler, tripHandler, settingsHandler)

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

func setupRoutes(router *gin.Engine, clientHandler *client.Handler, tripHandler *trip.Handler, settingsHandler *settings.Handler) {
	router.GET("/health", health.HealthHandler)
	router.GET("/ready", health.ReadinessHandler)

	v1 := router.Group("/api/v1")
	{
		// Trip routes
		v1.POST("/trips", tripHandler.CreateTrip)
		v1.GET("/trips", tripHandler.GetTrips)
		v1.GET("/trips/:id", tripHandler.GetTripByID)
		v1.PUT("/trips/:id", tripHandler.UpdateTrip)
		v1.DELETE("/trips/:id", tripHandler.DeleteTrip)
		v1.GET("/trips/summary", tripHandler.GetSummary)

		// Client routes
		v1.GET("/clients", clientHandler.GetSuggestions)

		// Settings routes
		v1.GET("/settings", settingsHandler.GetSettings)
		v1.PUT("/settings", settingsHandler.UpdateSettings)
	}
}
