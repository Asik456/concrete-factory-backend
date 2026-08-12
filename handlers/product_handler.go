package handlers

import (
	"concrete-factory-backend/config"
	"concrete-factory-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetProducts(c *gin.Context) {
	var products []models.Product
	query := config.DB.Preload("Specs").Preload("Variants")
	if categoryID := c.Query("category_id"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if c.Query("active") == "true" {
		query = query.Where("is_active = ?", true)
	}
	if search := c.Query("search"); search != "" {
		like := "%" + search + "%"
		query = query.Where("name_ru ILIKE ? OR name_kz ILIKE ? OR name_en ILIKE ?", like, like, like)
	}
	query.Find(&products)
	c.JSON(http.StatusOK, products)
}

func GetProductByID(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := config.DB.Preload("Specs").Preload("Variants").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, product)
}

func CreateProduct(c *gin.Context) {
	var body struct {
		CategoryID     uint                    `json:"category_id"`
		NameRu         string                  `json:"name_ru"`
		NameKz         string                  `json:"name_kz"`
		NameEn         string                  `json:"name_en"`
		DescriptionRu  string                  `json:"description_ru"`
		DescriptionKz  string                  `json:"description_kz"`
		DescriptionEn  string                  `json:"description_en"`
		Price          float64                 `json:"price"`
		DiscountPrice  *float64                `json:"discount_price"`
		PriceWholesale *float64                `json:"price_wholesale"`
		Image          string                  `json:"image"`
		IsActive       bool                    `json:"is_active"`
		Specs          []models.ProductSpec    `json:"specs"`
		Variants       []models.ProductVariant `json:"variants"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product := models.Product{
		CategoryID:     body.CategoryID,
		NameRu:         body.NameRu,
		NameKz:         body.NameKz,
		NameEn:         body.NameEn,
		DescriptionRu:  body.DescriptionRu,
		DescriptionKz:  body.DescriptionKz,
		DescriptionEn:  body.DescriptionEn,
		Price:          body.Price,
		DiscountPrice:  body.DiscountPrice,
		PriceWholesale: body.PriceWholesale,
		Image:          body.Image,
		IsActive:       body.IsActive,
	}
	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(body.Specs) > 0 {
		for i := range body.Specs {
			body.Specs[i].ProductID = product.ID
			body.Specs[i].ID = 0
		}
		config.DB.Create(&body.Specs)
		product.Specs = body.Specs
	}
	if len(body.Variants) > 0 {
		for i := range body.Variants {
			body.Variants[i].ProductID = product.ID
			body.Variants[i].ID = 0
		}
		config.DB.Create(&body.Variants)
		product.Variants = body.Variants
	}
	c.JSON(http.StatusCreated, product)
}

func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	var body struct {
		CategoryID     uint                    `json:"category_id"`
		NameRu         string                  `json:"name_ru"`
		NameKz         string                  `json:"name_kz"`
		NameEn         string                  `json:"name_en"`
		DescriptionRu  string                  `json:"description_ru"`
		DescriptionKz  string                  `json:"description_kz"`
		DescriptionEn  string                  `json:"description_en"`
		Price          float64                 `json:"price"`
		DiscountPrice  *float64                `json:"discount_price"`
		PriceWholesale *float64                `json:"price_wholesale"`
		Image          string                  `json:"image"`
		IsActive       bool                    `json:"is_active"`
		Specs          []models.ProductSpec    `json:"specs"`
		Variants       []models.ProductVariant `json:"variants"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product.CategoryID = body.CategoryID
	product.NameRu = body.NameRu
	product.NameKz = body.NameKz
	product.NameEn = body.NameEn
	product.DescriptionRu = body.DescriptionRu
	product.DescriptionKz = body.DescriptionKz
	product.DescriptionEn = body.DescriptionEn
	product.Price = body.Price
	product.DiscountPrice = body.DiscountPrice
	product.PriceWholesale = body.PriceWholesale
	product.Image = body.Image
	product.IsActive = body.IsActive
	config.DB.Save(&product)

	if body.Specs != nil {
		config.DB.Where("product_id = ?", product.ID).Delete(&models.ProductSpec{})
		for i := range body.Specs {
			body.Specs[i].ProductID = product.ID
			body.Specs[i].ID = 0
		}
		if len(body.Specs) > 0 {
			config.DB.Create(&body.Specs)
		}
		product.Specs = body.Specs
	}
	if body.Variants != nil {
		config.DB.Where("product_id = ?", product.ID).Delete(&models.ProductVariant{})
		for i := range body.Variants {
			body.Variants[i].ProductID = product.ID
			body.Variants[i].ID = 0
		}
		if len(body.Variants) > 0 {
			config.DB.Create(&body.Variants)
		}
		product.Variants = body.Variants
	}
	c.JSON(http.StatusOK, product)
}

func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	config.DB.Where("product_id = ?", id).Delete(&models.ProductSpec{})
	config.DB.Delete(&models.Product{}, id)
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted"})
}
