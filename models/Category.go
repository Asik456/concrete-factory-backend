package models

type Category struct {
	ID       uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	NameRu   string    `json:"name_ru"`
	NameKz   string    `json:"name_kz"`
	NameEn   string    `json:"name_en"`
	Slug     string    `gorm:"unique" json:"slug"`
	Products []Product `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
}
