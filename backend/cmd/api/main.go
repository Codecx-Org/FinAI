package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/Codecx-Org/FinAI/backend/internal/shared/cache"
	"github.com/Codecx-Org/FinAI/backend/internal/shared/config"
	shareddb "github.com/Codecx-Org/FinAI/backend/internal/shared/db"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	gormDB, err := shareddb.Open(cfg.Database)
	if err != nil {
		logger.Error("database open failed", "err", err)
		os.Exit(1)
	}

	redisClient := cache.NewRedis(cfg.Redis)
	defer redisClient.Close()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	srv := &http.Server{
		Addr: cfg.Addr,
		Handler: NewRouter(Dependencies{
			Config: cfg,
			Ready: func(r *http.Request) error {
				if err := shareddb.Ping(r.Context(), gormDB); err != nil {
					return err
				}
				return redisClient.Ping(r.Context())
			},
		}),
	}

	go func() {
		logger.Info("api listening", "addr", cfg.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("api server failed", "err", err)
			stop()
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("api shutdown failed", "err", err)
		os.Exit(1)
	}
}
