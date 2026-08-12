package main

import (
	"concrete-factory-backend/config"
	"concrete-factory-backend/handlers"
	"concrete-factory-backend/middleware"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// .env is optional — if absent, ConnectDB falls back to its built-in defaults.
	_ = godotenv.Load()

	config.ConnectDB()

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Public
	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)
	r.POST("/verify-email", handlers.VerifyEmail)
	r.POST("/resend-verification-code", handlers.ResendVerificationCode)
	r.POST("/forgot-password", handlers.ForgotPassword)
	r.POST("/reset-password", handlers.ResetPassword)
	r.GET("/categories", handlers.GetCategories)
	r.GET("/products", handlers.GetProducts)
	r.GET("/products/:id", handlers.GetProductByID)
	r.POST("/inquiries", handlers.CreateInquiry)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "concrete-factory"})
	})

	// Auth
	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		auth.GET("/me", handlers.GetMe)
		auth.POST("/notify", handlers.SendNotification)

		// Admin
		admin := auth.Group("/")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.GET("/users", handlers.GetAllUsers)
			admin.PUT("/users/:id/role", handlers.UpdateUserRole)
			admin.PUT("/users/:id/block", handlers.UpdateUserBlock)

			admin.POST("/categories", handlers.CreateCategory)
			admin.PUT("/categories/:id", handlers.UpdateCategory)
			admin.DELETE("/categories/:id", handlers.DeleteCategory)

			admin.POST("/products", handlers.CreateProduct)
			admin.PUT("/products/:id", handlers.UpdateProduct)
			admin.DELETE("/products/:id", handlers.DeleteProduct)

			admin.GET("/inquiries", handlers.GetInquiries)
			admin.PUT("/inquiries/:id/read", handlers.MarkInquiryRead)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
