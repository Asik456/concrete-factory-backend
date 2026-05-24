package handlers

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/go-resty/resty/v2"
)

func getNotificationURL() string {
	if url := os.Getenv("NOTIFICATION_URL"); url != "" {
		return url
	}
	return "http://localhost:8081"
}

func SendNotification(c *gin.Context) {
	var body struct {
		UserID  uint   `json:"user_id"`
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := resty.New()
	client.OnBeforeRequest(func(c *resty.Client, req *resty.Request) error {
		fmt.Println("[Resty] Sending:", req.Method, req.URL)
		return nil
	})
	client.OnAfterResponse(func(c *resty.Client, resp *resty.Response) error {
		fmt.Println("[Resty] Response:", resp.StatusCode())
		return nil
	})

	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(body).
		Post(getNotificationURL() + "/notify")

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "notification service unavailable"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"notification_response": resp.String()})
}
