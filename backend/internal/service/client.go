package service

import (
	"context"
	"strings"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/oscar/mileagetracker/internal/repository"
	"gorm.io/gorm"
)

type ClientService interface {
	GetOrCreateClient(ctx context.Context, name string) (*domain.Client, error)
	GetSuggestions(ctx context.Context, query string) ([]domain.Client, error)
}

type clientService struct {
	clientRepo repository.ClientRepository
}

func NewClientService(clientRepo repository.ClientRepository) ClientService {
	return &clientService{
		clientRepo: clientRepo,
	}
}

func (s *clientService) GetOrCreateClient(ctx context.Context, name string) (*domain.Client, error) {
	// Trim and validate name
	name = strings.TrimSpace(name)
	if len(name) == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	// Try to find existing client
	client, err := s.clientRepo.FindByName(ctx, name)
	if err == nil {
		return client, nil
	}

	// If not found, create new client
	if err == gorm.ErrRecordNotFound {
		client = &domain.Client{
			Name: name,
		}
		err = s.clientRepo.Create(ctx, client)
		if err != nil {
			return nil, err
		}
		return client, nil
	}

	return nil, err
}

func (s *clientService) GetSuggestions(ctx context.Context, query string) ([]domain.Client, error) {
	query = strings.TrimSpace(query)
	if len(query) == 0 {
		return []domain.Client{}, nil
	}

	return s.clientRepo.GetSuggestions(ctx, query, 10)
}
