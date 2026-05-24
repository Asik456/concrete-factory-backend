package models

type Product struct {
	ID            uint          `gorm:"primaryKey;autoIncrement" json:"id"`
	CategoryID    uint          `json:"category_id"`
	NameRu        string        `json:"name_ru"`
	NameKz        string        `json:"name_kz"`
	NameEn        string        `json:"name_en"`
	DescriptionRu string        `json:"description_ru"`
	DescriptionKz string        `json:"description_kz"`
	DescriptionEn string        `json:"description_en"`
	Price         float64       `json:"price"`
	DiscountPrice *float64      `json:"discount_price,omitempty"`
	Image         string        `json:"image"`
	IsActive      bool          `json:"is_active" gorm:"default:true"`
	Specs         []ProductSpec `gorm:"foreignKey:ProductID" json:"specs,omitempty"`
}
