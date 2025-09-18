// backend/internal/email/smtp.go

package email

import (
	"fmt"
	"net/smtp"

	"github.com/pitturu-ppaturu/backend/internal/config"
)

// Sender defines the interface for sending emails.
type Sender interface {
	Send(to, subject, body string) error
}

// SMTPSender is an SMTP-based email sender.
type SMTPSender struct {
	cfg *config.Config
}

// NewSMTPSender creates a new SMTPSender.
func NewSMTPSender(cfg *config.Config) Sender {
	return &SMTPSender{cfg: cfg}
}

// Send sends an email using SMTP.
func (s *SMTPSender) Send(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", s.cfg.SMTPHost, s.cfg.SMTPPort)
	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n\r\n%s", to, subject, body))

	auth := smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPass, s.cfg.SMTPHost)

	return smtp.SendMail(addr, auth, s.cfg.SMTPSender, []string{to}, msg)
}