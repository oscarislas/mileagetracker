package logger

import (
	"go.uber.org/zap"
)

var Logger *zap.Logger

func Init(level string) error {
	var config zap.Config

	switch level {
	case "production":
		config = zap.NewProductionConfig()
	default:
		config = zap.NewDevelopmentConfig()
	}

	var err error
	Logger, err = config.Build()
	if err != nil {
		return err
	}

	return nil
}

func Sync() {
	if Logger != nil {
		_ = Logger.Sync()
	}
}

func Info(msg string, fields ...zap.Field) {
	Logger.Info(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	Logger.Error(msg, fields...)
}

func Debug(msg string, fields ...zap.Field) {
	Logger.Debug(msg, fields...)
}

func Warn(msg string, fields ...zap.Field) {
	Logger.Warn(msg, fields...)
}
