package repository

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/oscar/mileagetracker/internal/domain"
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
	start := time.Now()
	defer func() {
		duration := time.Since(start)
		if duration > 50*time.Millisecond {
			log.Printf("[SLOW_QUERY] Create client took %v", duration)
		}
	}()

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	return r.db.WithContext(ctxWithTimeout).Create(client).Error
}

func (r *clientRepository) FindByName(ctx context.Context, name string) (*domain.Client, error) {
	start := time.Now()
	defer func() {
		duration := time.Since(start)
		if duration > 30*time.Millisecond {
			log.Printf("[SLOW_QUERY] FindByName took %v (name=%s)", duration, name)
		}
	}()

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 2*time.Second)
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
	start := time.Now()
	defer func() {
		duration := time.Since(start)
		if duration > 100*time.Millisecond {
			log.Printf("[SLOW_QUERY] GetSuggestions took %v (query=%s, limit=%d)", duration, query, limit)
		}
	}()

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 3*time.Second)
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
