package config

import (
	"os"
	"strconv"
)

type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
	Logger   LoggerConfig
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
	SSLMode  string
}

type ServerConfig struct {
	Port int
	Mode string
}

type LoggerConfig struct {
	Level string
}

func Load() *Config {
	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			Name:     getEnv("DB_NAME", "mileagetracker"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Server: ServerConfig{
			Port: getEnvAsInt("SERVER_PORT", 8080),
			Mode: getEnv("GIN_MODE", "debug"),
		},
		Logger: LoggerConfig{
			Level: getEnv("LOG_LEVEL", "debug"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}
