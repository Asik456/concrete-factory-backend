package handlers

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

func sendAdminEmail(subject, body string) {
	from := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASSWORD")
	to := os.Getenv("ADMIN_EMAIL")

	if from == "" || password == "" || to == "" {
		return
	}

	auth := smtp.PlainAuth("", from, password, "smtp.gmail.com")

	msg := []byte(fmt.Sprintf(
		"From: JBI Beton <%s>\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		from, to, subject, body,
	))

	err := smtp.SendMail("smtp.gmail.com:587", auth, from, []string{to}, msg)
	if err != nil {
		log.Println("[Email] Failed to send:", err)
	} else {
		log.Println("[Email] Sent successfully to", to)
	}
}

func emailNewInquiry(name, phone, message string) {
	subject := "📞 Новая заявка на обратный звонок — JBI Beton"
	body := fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1f2937;padding:20px;border-radius:8px 8px 0 0">
    <h2 style="color:#fbbf24;margin:0">🏗️ JBI Beton — Новая заявка</h2>
  </div>
  <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px">
    <h3 style="color:#111827">Данные клиента:</h3>
    <table style="width:100%%">
      <tr><td style="color:#6b7280;padding:6px 0">Имя:</td><td style="font-weight:bold">%s</td></tr>
      <tr><td style="color:#6b7280;padding:6px 0">Телефон:</td><td style="font-weight:bold"><a href="tel:%s">%s</a></td></tr>
      <tr><td style="color:#6b7280;padding:6px 0;vertical-align:top">Сообщение:</td><td>%s</td></tr>
    </table>
    <div style="margin-top:20px;padding:12px;background:#fef3c7;border-radius:6px;color:#92400e">
      ⏰ Ответьте клиенту в течение 30 минут
    </div>
  </div>
</div>`, name, phone, phone, message)

	go sendAdminEmail(subject, body)
}

func emailNewOrder(orderID uint, userName, deliveryType, address string, total float64) {
	subject := fmt.Sprintf("🛒 Новый заказ #%d — JBI Beton", orderID)
	deliveryText := "Самовывоз"
	if deliveryType == "delivery" {
		deliveryText = "Доставка: " + address
	}
	body := fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1f2937;padding:20px;border-radius:8px 8px 0 0">
    <h2 style="color:#fbbf24;margin:0">🏗️ JBI Beton — Новый заказ</h2>
  </div>
  <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px">
    <h3 style="color:#111827">Заказ #%d</h3>
    <table style="width:100%%">
      <tr><td style="color:#6b7280;padding:6px 0">Клиент:</td><td style="font-weight:bold">%s</td></tr>
      <tr><td style="color:#6b7280;padding:6px 0">Получение:</td><td>%s</td></tr>
      <tr><td style="color:#6b7280;padding:6px 0">Сумма:</td><td style="font-size:18px;font-weight:bold;color:#059669">%s тг</td></tr>
    </table>
    <div style="margin-top:20px;padding:12px;background:#d1fae5;border-radius:6px;color:#065f46">
      ✅ Подтвердите заказ в панели управления
    </div>
  </div>
</div>`, orderID, userName, deliveryText, formatNumber(total))

	go sendAdminEmail(subject, body)
}

func formatNumber(n float64) string {
	return fmt.Sprintf("%.0f", n)
}
