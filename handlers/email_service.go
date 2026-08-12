package handlers

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

func sendAdminEmail(subject, body string) {
	to := os.Getenv("ADMIN_EMAIL")
	if to == "" {
		return
	}
	sendEmail(to, subject, body)
}

func smtpConfigured() bool {
	return os.Getenv("SMTP_USER") != "" && os.Getenv("SMTP_PASSWORD") != ""
}

func sendEmail(to, subject, body string) {
	from := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASSWORD")

	if from == "" || password == "" || to == "" {
		log.Printf("[Email] SMTP_USER/SMTP_PASSWORD not set — skipping send of %q to %s\n", subject, to)
		return
	}

	auth := smtp.PlainAuth("", from, password, "smtp.gmail.com")

	msg := []byte(fmt.Sprintf(
		"From: JSI Beton <%s>\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		from, to, subject, body,
	))

	err := smtp.SendMail("smtp.gmail.com:587", auth, from, []string{to}, msg)
	if err != nil {
		log.Println("[Email] Failed to send:", err)
	} else {
		log.Println("[Email] Sent successfully to", to)
	}
}

func emailVerificationCode(toEmail, name, code string) {
	if !smtpConfigured() {
		log.Printf("[Email][DEV] SMTP не настроен — код подтверждения для %s: %s\n", toEmail, code)
	}
	subject := "Код подтверждения регистрации — JSI Beton"
	body := fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1f2937;padding:20px;border-radius:8px 8px 0 0">
    <h2 style="color:#fbbf24;margin:0">🏗️ JSI Beton</h2>
  </div>
  <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px">
    <p>Здравствуйте, %s!</p>
    <p>Спасибо за регистрацию на сайте JSI Beton. Введите код подтверждения на сайте, чтобы завершить регистрацию:</p>
    <div style="margin:20px 0;padding:16px;background:#fef3c7;border-radius:6px;text-align:center">
      <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#92400e">%s</span>
    </div>
    <p style="color:#6b7280;font-size:13px">Код действителен 15 минут. Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
  </div>
</div>`, name, code)
	go sendEmail(toEmail, subject, body)
}

func emailWelcome(toEmail, name string) {
	subject := "Добро пожаловать в JSI Beton!"
	body := fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1f2937;padding:20px;border-radius:8px 8px 0 0">
    <h2 style="color:#fbbf24;margin:0">🏗️ JSI Beton</h2>
  </div>
  <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px">
    <p>Здравствуйте, %s!</p>
    <p>Вы успешно зарегистрировались и подтвердили почту на сайте JSI Beton. Теперь вам доступен личный кабинет.</p>
    <p style="margin-top:20px;padding:12px;background:#d1fae5;border-radius:6px;color:#065f46">
      ✅ Спасибо, что выбрали нас!
    </p>
  </div>
</div>`, name)
	go sendEmail(toEmail, subject, body)
}

func emailNewInquiry(name, phone, message string) {
	subject := "📞 Новая заявка на обратный звонок — JSI Beton"
	body := fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1f2937;padding:20px;border-radius:8px 8px 0 0">
    <h2 style="color:#fbbf24;margin:0">🏗️ JSI Beton — Новая заявка</h2>
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
