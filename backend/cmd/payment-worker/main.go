package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/Codecx-Org/FinAI/backend/internal/shared/config"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	logger.Info("payment worker ready", "env", cfg.Env, "stream", "payments.commands")
	<-ctx.Done()
	logger.Info("payment worker stopped")
}
