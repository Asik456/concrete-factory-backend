package handlers

import (
	"concrete-factory-backend/config"
	"concrete-factory-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateInquiry(c *gin.Context) {
	var body struct {
		Name    string `json:"name" binding:"required"`
		Phone   string `json:"phone" binding:"required"`
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	inquiry := models.Inquiry{
		Name:    body.Name,
		Phone:   body.Phone,
		Message: body.Message,
	}
	if err := config.DB.Create(&inquiry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	emailNewInquiry(inquiry.Name, inquiry.Phone, inquiry.Message)

	c.JSON(http.StatusCreated, inquiry)
}

func GetInquiries(c *gin.Context) {
	var inquiries []models.Inquiry
	config.DB.Order("created_at desc").Find(&inquiries)
	c.JSON(http.StatusOK, inquiries)
}

func MarkInquiryRead(c *gin.Context) {
	id := c.Param("id")
	var inquiry models.Inquiry
	if err := config.DB.First(&inquiry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inquiry not found"})
		return
	}
	config.DB.Model(&inquiry).Update("is_read", true)
	c.JSON(http.StatusOK, inquiry)
}
