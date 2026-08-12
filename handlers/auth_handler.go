package handlers

import (
	"concrete-factory-backend/config"
	"concrete-factory-backend/middleware"
	"concrete-factory-backend/models"
	"crypto/rand"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"time"
)

const verificationCodeTTL = 15 * time.Minute
const resetCodeTTL = 15 * time.Minute

func generateVerificationCode() string {
	b := make([]byte, 4)
	rand.Read(b)
	n := (uint32(b[0])<<24 | uint32(b[1])<<16 | uint32(b[2])<<8 | uint32(b[3])) % 1000000
	return fmt.Sprintf("%06d", n)
}

func Register(c *gin.Context) {
	var body struct {
		Name     string `json:"name" binding:"required"`
		Phone    string `json:"phone"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	code := generateVerificationCode()
	expiresAt := time.Now().Add(verificationCodeTTL)

	user := models.User{
		Name:                      body.Name,
		Phone:                     body.Phone,
		Email:                     body.Email,
		Password:                  string(hashedPassword),
		Role:                      "customer",
		IsVerified:                false,
		VerificationCode:          code,
		VerificationCodeExpiresAt: &expiresAt,
	}

	var existing models.User
	if config.DB.Where("email = ?", body.Email).First(&existing).Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}
	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed: " + err.Error()})
		return
	}

	emailVerificationCode(user.Email, user.Name, code)

	c.JSON(http.StatusCreated, gin.H{
		"id":    user.ID,
		"email": user.Email,
	})
}

func VerifyEmail(c *gin.Context) {
	var body struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if user.IsVerified {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already verified"})
		return
	}
	if user.VerificationCode == "" || user.VerificationCode != body.Code {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code"})
		return
	}
	if user.VerificationCodeExpiresAt == nil || time.Now().After(*user.VerificationCodeExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code expired"})
		return
	}

	config.DB.Model(&user).Updates(map[string]interface{}{
		"is_verified":                  true,
		"verification_code":            "",
		"verification_code_expires_at": nil,
	})
	emailWelcome(user.Email, user.Name)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": user.ID,
		"role":   user.Role,
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	})
	tokenString, err := token.SignedString(middleware.JwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"phone": user.Phone,
			"role":  user.Role,
		},
	})
}

func ResendVerificationCode(c *gin.Context) {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if user.IsVerified {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already verified"})
		return
	}

	code := generateVerificationCode()
	expiresAt := time.Now().Add(verificationCodeTTL)
	config.DB.Model(&user).Updates(map[string]interface{}{
		"verification_code":            code,
		"verification_code_expires_at": expiresAt,
	})
	emailVerificationCode(user.Email, user.Name, code)

	c.JSON(http.StatusOK, gin.H{"message": "Code resent"})
}

func ForgotPassword(c *gin.Context) {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", body.Email).First(&user).Error; err == nil {
		code := generateVerificationCode()
		expiresAt := time.Now().Add(resetCodeTTL)
		config.DB.Model(&user).Updates(map[string]interface{}{
			"reset_code":            code,
			"reset_code_expires_at": expiresAt,
		})
		emailPasswordResetCode(user.Email, user.Name, code)
	}

	// Always respond the same way whether or not the email is registered,
	// so this endpoint can't be used to check which emails have accounts.
	c.JSON(http.StatusOK, gin.H{"message": "If this email is registered, a reset code has been sent"})
}

func ResetPassword(c *gin.Context) {
	var body struct {
		Email       string `json:"email"`
		Code        string `json:"code"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code"})
		return
	}
	if user.ResetCode == "" || user.ResetCode != body.Code {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code"})
		return
	}
	if user.ResetCodeExpiresAt == nil || time.Now().After(*user.ResetCodeExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code expired"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(body.NewPassword), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	config.DB.Model(&user).Updates(map[string]interface{}{
		"password":               string(hashedPassword),
		"reset_code":             "",
		"reset_code_expires_at":  nil,
	})
	emailPasswordChanged(user.Email, user.Name)

	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}

func Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if user.IsBlocked {
		c.JSON(http.StatusForbidden, gin.H{"error": "account_blocked"})
		return
	}
	if !user.IsVerified {
		c.JSON(http.StatusForbidden, gin.H{"error": "email_not_verified", "email": user.Email})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": user.ID,
		"role":   user.Role,
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(middleware.JwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func GetMe(c *gin.Context) {
	userID, _ := c.Get("userID")
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
		"phone": user.Phone,
		"role":  user.Role,
	})
}

func GetAllUsers(c *gin.Context) {
	var users []models.User
	config.DB.Find(&users)
	c.JSON(http.StatusOK, users)
}

func UpdateUserRole(c *gin.Context) {
	id := c.Param("id")
	requesterID, _ := c.Get("userID")
	if uid, ok := requesterID.(float64); ok && fmt.Sprintf("%d", uint(uid)) == id {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot change your own role"})
		return
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || (body.Role != "admin" && body.Role != "customer") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	config.DB.Model(&user).Update("role", body.Role)
	c.JSON(http.StatusOK, user)
}

func UpdateUserBlock(c *gin.Context) {
	id := c.Param("id")
	requesterID, _ := c.Get("userID")
	if uid, ok := requesterID.(float64); ok && fmt.Sprintf("%d", uint(uid)) == id {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot block yourself"})
		return
	}

	var body struct {
		IsBlocked bool `json:"is_blocked"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	config.DB.Model(&user).Update("is_blocked", body.IsBlocked)
	c.JSON(http.StatusOK, user)
}
