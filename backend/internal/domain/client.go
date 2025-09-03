package domain

import "time"

type Client struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"type:varchar(30);not null;uniqueIndex"`
	CreatedAt time.Time `json:"created_at"`
}

func (Client) TableName() string {
	return "clients"
}
