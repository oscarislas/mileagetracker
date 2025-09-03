package domain

import (
	"time"
)

type Trip struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	ClientID   *uint     `json:"client_id" gorm:"index"`
	ClientName string    `json:"client_name" gorm:"type:varchar(30);not null;index"`
	TripDate   string    `json:"trip_date" gorm:"type:date;not null;index"` // YYYY-MM-DD format
	Miles      float64   `json:"miles" gorm:"type:decimal(8,2);not null;check:miles >= 0"`
	Notes      string    `json:"notes" gorm:"type:text"`
	CreatedAt  time.Time `json:"created_at" gorm:"index"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relationship
	Client *Client `json:"client,omitempty" gorm:"foreignKey:ClientID"`
}

func (Trip) TableName() string {
	return "trips"
}

// CreateTripRequest represents the data needed to create a new trip
type CreateTripRequest struct {
	ClientName string  `json:"client_name" binding:"required,max=30"`
	TripDate   string  `json:"trip_date" binding:"required"` // YYYY-MM-DD
	Miles      float64 `json:"miles" binding:"required,min=0"`
	Notes      string  `json:"notes"`
}

// UpdateTripRequest represents the data needed to update a trip
type UpdateTripRequest struct {
	ClientName string  `json:"client_name" binding:"required,max=30"`
	TripDate   string  `json:"trip_date" binding:"required"` // YYYY-MM-DD
	Miles      float64 `json:"miles" binding:"required,min=0"`
	Notes      string  `json:"notes"`
}
