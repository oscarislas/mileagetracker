package domain

import "time"

type Settings struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Key       string    `json:"key" gorm:"type:varchar(50);not null;uniqueIndex"`
	Value     string    `json:"value" gorm:"type:varchar(100);not null"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Settings) TableName() string {
	return "settings"
}

// UpdateSettingsRequest represents the data needed to update settings
type UpdateSettingsRequest struct {
	MileageRate float64 `json:"mileage_rate" binding:"required,min=0"`
}

// SettingsResponse represents the settings returned to the client
type SettingsResponse struct {
	MileageRate float64 `json:"mileage_rate"`
}
