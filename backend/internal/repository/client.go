package repository

import (
	"context"
	"strings"

	"github.com/oscar/mileagetracker/internal/domain"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type ClientRepository interface {
	Create(ctx context.Context, client *domain.Client) error
	FindByName(ctx context.Context, name string) (*domain.Client, error)
	GetSuggestions(ctx context.Context, query string, limit int) ([]domain.Client, error)
}

type clientRepository struct {
	db *gorm.DB
}

func NewClientRepository(db *gorm.DB) ClientRepository {
	return &clientRepository{db: db}
}

func (r *clientRepository) Create(ctx context.Context, client *domain.Client) error {
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpCreate, "client")()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpCreate))
	defer cancel()

	return r.db.WithContext(ctxWithTimeout).Create(client).Error
}

func (r *clientRepository) FindByName(ctx context.Context, name string) (*domain.Client, error) {
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpFindByName, "client", zap.String("name", name))()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpFindByName))
	defer cancel()

	var client domain.Client
	// Use index on name field for exact matches
	err := r.db.WithContext(ctxWithTimeout).Where("name = ?", name).First(&client).Error
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *clientRepository) GetSuggestions(ctx context.Context, query string, limit int) ([]domain.Client, error) {
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpGetSuggestions, "client", zap.String("query", query), zap.Int("limit", limit))()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpGetSuggestions))
	defer cancel()

	var clients []domain.Client

	// Trim and normalize the query
	normalizedQuery := strings.TrimSpace(strings.ToLower(query))
	if normalizedQuery == "" {
		return []domain.Client{}, nil
	}

	// Use database-specific optimized query
	var err error
	if r.db.Dialector.Name() == "postgres" {
		// PostgreSQL: use ILIKE with the optimized index
		err = r.db.WithContext(ctxWithTimeout).
			Where("LOWER(name) LIKE ?", "%"+normalizedQuery+"%").
			Order("name ASC").
			Limit(limit).
			Find(&clients).Error
	} else {
		// SQLite: use LIKE with LOWER() function
		err = r.db.WithContext(ctxWithTimeout).
			Where("LOWER(name) LIKE ?", "%"+normalizedQuery+"%").
			Order("name ASC").
			Limit(limit).
			Find(&clients).Error
	}

	return clients, err
}
