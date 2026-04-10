package models

type Category struct {
	ID       uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name     string    `json:"name"`
	Slug     string    `gorm:"unique" json:"slug"`
	Products []Product `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
}
