package models

type User struct {
	ID       uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `gorm:"unique" json:"email"`
	Password string `json:"-"`
	Role     string `gorm:"default:customer" json:"role"`
}
