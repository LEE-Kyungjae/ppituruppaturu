package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
	"github.com/pitturu-ppaturu/backend/internal/config"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	if len(os.Args) < 2 {
		log.Fatal("Usage: migrate <up|down|version|create|force|drop> [args...]")
	}

	command := os.Args[1]

	switch command {
	case "up":
		if err := runMigrateUp(cfg.DSN); err != nil {
			log.Fatal("Failed to run up migrations:", err)
		}
		fmt.Println("✅ Up migrations completed successfully")

	case "down":
		steps := 1
		if len(os.Args) > 2 {
			if s, err := strconv.Atoi(os.Args[2]); err == nil && s > 0 {
				steps = s
			}
		}
		if err := runMigrateDown(cfg.DSN, steps); err != nil {
			log.Fatal("Failed to run down migrations:", err)
		}
		fmt.Printf("✅ Down migrations completed successfully (%d steps)\n", steps)

	case "version":
		version, dirty, err := getMigrationVersion(cfg.DSN)
		if err != nil {
			log.Fatal("Failed to get migration version:", err)
		}
		status := "clean"
		if dirty {
			status = "dirty"
		}
		fmt.Printf("Current version: %d (%s)\n", version, status)

	case "create":
		if len(os.Args) < 3 {
			log.Fatal("Usage: migrate create <migration_name>")
		}
		migrationName := os.Args[2]
		if err := createMigration(migrationName); err != nil {
			log.Fatal("Failed to create migration:", err)
		}

	case "force":
		if len(os.Args) < 3 {
			log.Fatal("Usage: migrate force <version>")
		}
		version, err := strconv.Atoi(os.Args[2])
		if err != nil {
			log.Fatal("Invalid version number:", err)
		}
		if err := forceMigrationVersion(cfg.DSN, version); err != nil {
			log.Fatal("Failed to force migration version:", err)
		}
		fmt.Printf("✅ Forced migration version to %d\n", version)

	case "drop":
		fmt.Print("Are you sure you want to drop all tables? (y/N): ")
		var response string
		if _, err := fmt.Scanln(&response); err != nil {
			log.Fatal("Failed to read confirmation:", err)
		}
		if response != "y" && response != "Y" {
			fmt.Println("Operation cancelled")
			return
		}
		if err := dropDatabase(cfg.DSN); err != nil {
			log.Fatal("Failed to drop database:", err)
		}
		fmt.Println("✅ Database dropped successfully")

	default:
		log.Fatal("Unknown command. Use: up, down, version, create, force, or drop")
	}
}

func getMigrateInstance(dsn string) (*migrate.Migrate, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to create postgres driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://internal/migrations",
		"postgres", driver)
	if err != nil {
		return nil, fmt.Errorf("failed to create migrate instance: %w", err)
	}

	return m, nil
}

func runMigrateUp(dsn string) error {
	m, err := getMigrateInstance(dsn)
	if err != nil {
		return err
	}
	defer m.Close()

	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration up failed: %w", err)
	}

	if err == migrate.ErrNoChange {
		fmt.Println("No migrations to apply")
	}

	return nil
}

func runMigrateDown(dsn string, steps int) error {
	m, err := getMigrateInstance(dsn)
	if err != nil {
		return err
	}
	defer m.Close()

	err = m.Steps(-steps)
	if err != nil {
		return fmt.Errorf("migration down failed: %w", err)
	}

	return nil
}

func getMigrationVersion(dsn string) (uint, bool, error) {
	m, err := getMigrateInstance(dsn)
	if err != nil {
		return 0, false, err
	}
	defer m.Close()

	version, dirty, err := m.Version()
	if err != nil {
		return 0, false, fmt.Errorf("failed to get version: %w", err)
	}

	return version, dirty, nil
}

func forceMigrationVersion(dsn string, version int) error {
	m, err := getMigrateInstance(dsn)
	if err != nil {
		return err
	}
	defer m.Close()

	err = m.Force(version)
	if err != nil {
		return fmt.Errorf("failed to force version: %w", err)
	}

	return nil
}

func dropDatabase(dsn string) error {
	m, err := getMigrateInstance(dsn)
	if err != nil {
		return err
	}
	defer m.Close()

	err = m.Drop()
	if err != nil {
		return fmt.Errorf("failed to drop database: %w", err)
	}

	return nil
}

func createMigration(name string) error {
	timestamp := time.Now().Unix()

	upFile := fmt.Sprintf("internal/migrations/%06d_%s.up.sql", timestamp, name)
	downFile := fmt.Sprintf("internal/migrations/%06d_%s.down.sql", timestamp, name)

	// Create up migration file
	upContent := fmt.Sprintf("-- Migration: %s\n-- Created: %s\n\n-- Write your UP migration here\n",
		name, time.Now().Format("2006-01-02 15:04:05"))

	if err := os.WriteFile(upFile, []byte(upContent), 0644); err != nil {
		return fmt.Errorf("failed to create up migration file: %w", err)
	}

	// Create down migration file
	downContent := fmt.Sprintf("-- Migration: %s\n-- Created: %s\n\n-- Write your DOWN migration here\n",
		name, time.Now().Format("2006-01-02 15:04:05"))

	if err := os.WriteFile(downFile, []byte(downContent), 0644); err != nil {
		return fmt.Errorf("failed to create down migration file: %w", err)
	}

	fmt.Printf("✅ Created migration files:\n")
	fmt.Printf("   %s\n", upFile)
	fmt.Printf("   %s\n", downFile)

	return nil
}
