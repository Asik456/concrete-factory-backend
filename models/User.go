package models

import "time"

type User struct {
	ID                        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name                      string     `json:"name"`
	Phone                     string     `json:"phone"`
	Email                     string     `gorm:"unique" json:"email"`
	Password                  string     `json:"-"`
	Role                      string     `gorm:"default:customer" json:"role"`
	IsVerified                bool       `json:"is_verified" gorm:"default:false"`
	IsBlocked                 bool       `json:"is_blocked" gorm:"default:false"`
	VerificationCode          string     `json:"-"`
	VerificationCodeExpiresAt *time.Time `json:"-"`
	CreatedAt                 time.Time  `json:"created_at"`
}
