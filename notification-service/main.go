package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.POST("/notify", func(c *gin.Context) {
		var body struct {
			UserID  uint   `json:"user_id"`
			Message string `json:"message"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{
			"status":  "sent",
			"user_id": body.UserID,
			"message": body.Message,
		})
	})

	r.GET("/notifications", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"data": []string{"msg1", "msg2"},
		})
	})

	r.PUT("/notify", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "updated",
		})
	})

	r.DELETE("/notify", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "deleted",
		})
	})
	r.Run(":8081")
}
