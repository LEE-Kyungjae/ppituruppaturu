// cmd/seed/main.go - 더미 데이터 시딩 시스템
package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"

	"github.com/pitturu-ppaturu/backend/internal/config"
	"golang.org/x/crypto/bcrypt"
	_ "github.com/lib/pq"
)

func main() {
	var action = flag.String("action", "help", "Action to perform: seed, clean, hard-clean, reset, hard-reset, help")
	flag.Parse()

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Connect to database
	db, err := sql.Open("postgres", cfg.DSN)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	switch *action {
	case "seed":
		seedData(db, cfg)
	case "clean":
		cleanData(db)
	case "hard-clean":
		hardCleanData(db)
	case "reset":
		cleanData(db)
		seedData(db, cfg)
	case "hard-reset":
		hardCleanData(db)
		seedData(db, cfg)
	default:
		printHelp()
	}
}

func seedData(db *sql.DB, cfg *config.Config) {
	fmt.Println("🌱 시딩 샘플 데이터...")

	// 1. Create test users
	if err := seedUsers(db, cfg); err != nil {
		log.Printf("❌ 사용자 시딩 실패: %v", err)
	} else {
		fmt.Println("✅ 테스트 사용자 생성 완료")
	}

	// 2. Create test games
	if err := seedGames(db); err != nil {
		log.Printf("❌ 게임 시딩 실패: %v", err)
	} else {
		fmt.Println("✅ 게임 데이터 생성 완료")
	}

	// 3. Create test posts
	if err := seedPosts(db); err != nil {
		log.Printf("❌ 게시글 시딩 실패: %v", err)
	} else {
		fmt.Println("✅ 커뮤니티 게시글 생성 완료")
	}

	// Items table not yet implemented, skipping for now

	fmt.Println("🎉 모든 샘플 데이터 시딩 완료!")
}

func seedUsers(db *sql.DB, cfg *config.Config) error {
	users := []struct {
		username string
		password string
		role     string
		profile  map[string]string
	}{
		{"testuser", "password123", "user", map[string]string{
			"display_name": "테스트 유저",
			"bio": "테스트용 계정입니다",
		}},
		{"admin", "admin123", "admin", map[string]string{
			"display_name": "관리자",
			"bio": "시스템 관리자 계정",
		}},
		{"gamer1", "gamer123", "user", map[string]string{
			"display_name": "게이머1",
			"bio": "게임을 사랑하는 유저",
		}},
		{"gamer2", "gamer123", "user", map[string]string{
			"display_name": "게이머2", 
			"bio": "경쟁을 즐기는 유저",
		}},
		{"buyer", "buyer123", "user", map[string]string{
			"display_name": "구매왕",
			"bio": "아이템 수집가",
		}},
	}

	for _, user := range users {
		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.password), cfg.BcryptCost)
		if err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}

		// Check if user exists
		var exists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", user.username).Scan(&exists)
		if err != nil {
			return fmt.Errorf("failed to check user existence: %w", err)
		}

		if !exists {
			// Create user
			_, err = db.Exec(`
				INSERT INTO users (username, password_hash, role, created_at, updated_at)
				VALUES ($1, $2, $3, NOW(), NOW())
			`, user.username, hashedPassword, user.role)
			if err != nil {
				return fmt.Errorf("failed to create user %s: %w", user.username, err)
			}

			fmt.Printf("  👤 생성된 사용자: %s (%s) - 비밀번호: %s\n", user.username, user.role, user.password)
		}
	}

	return nil
}

func seedGames(db *sql.DB) error {
	games := []struct {
		name           string
		description    string
		isActive       bool
		displayOrder   int
		category       string
		iconEmoji      string
		maxPlayers     int
		minPlayers     int
		difficultyLevel string
	}{
		{"주사위 배틀", "운과 전략을 겨루는 주사위 게임", true, 1, "strategy", "🎲", 4, 2, "easy"},
		{"카드 매치", "기억력을 시험하는 카드 맞추기 게임", true, 2, "puzzle", "🃏", 1, 1, "medium"},
		{"퍼즐 챌린지", "논리적 사고를 요구하는 퍼즐 게임", true, 3, "puzzle", "🧩", 1, 1, "hard"},
		{"스피드 레이싱", "빠른 반응속도가 필요한 레이싱 게임", true, 4, "action", "🏎️", 8, 1, "medium"},
		{"숫자 맞추기", "수학적 감각을 키우는 숫자 게임", true, 5, "educational", "🔢", 1, 1, "easy"},
		{"타워 디펜스", "전략적 사고가 필요한 디펜스 게임", false, 6, "strategy", "🏰", 1, 1, "hard"},
		{"메모리 게임", "기억력 향상을 위한 훈련 게임", false, 7, "puzzle", "🧠", 1, 1, "medium"},
		{"리듬 게임", "음악에 맞춰 플레이하는 리듬 게임", false, 8, "music", "🎵", 1, 1, "medium"},
		{"워드 퍼즐", "단어 실력을 늘리는 단어 게임", false, 9, "educational", "📝", 1, 1, "easy"},
		{"액션 슈터", "빠른 판단력이 필요한 슈팅 게임", false, 10, "action", "🎯", 6, 1, "hard"},
	}

	fmt.Println("🎮 게임 데이터 시딩 중...")

	for _, game := range games {
		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM games WHERE name = $1)", game.name).Scan(&exists)
		if err != nil {
			return fmt.Errorf("failed to check game existence: %w", err)
		}

		if !exists {
			_, err = db.Exec(`
				INSERT INTO games (name, description, is_active, display_order, category, icon_emoji, max_players, min_players, difficulty_level, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
			`, game.name, game.description, game.isActive, game.displayOrder, game.category, game.iconEmoji, game.maxPlayers, game.minPlayers, game.difficultyLevel)
			if err != nil {
				return fmt.Errorf("failed to seed game %s: %w", game.name, err)
			}

			status := "🟢 활성"
			if !game.isActive {
				status = "🔴 비활성"
			}
			fmt.Printf("  %s %s (%s) - %s\n", game.iconEmoji, game.name, status, game.description)
		}
	}

	fmt.Println("  ✅ 게임 데이터 시딩 완료")
	return nil
}

func seedPosts(db *sql.DB) error {
	posts := []struct {
		title   string
		content string
		author  string
	}{
		{"환영합니다! 피투루에 오신 것을 환영합니다", "안녕하세요! 새로운 게임 플랫폼 피투루에 오신 것을 환영합니다. 다양한 게임을 즐겨보세요!", "admin"},
		{"첫 번째 게임 후기", "피투피 배틀을 해봤는데 정말 재밌네요! 실시간 대전이 이렇게 스릴 넘칠 줄 몰랐어요.", "gamer1"},
		{"멀티 서바이벌 공략법", "멀티 서바이벌에서 생존하는 팁들을 공유해드립니다. 첫 번째는...", "gamer2"},
		{"아이템 추천!", "초보자들을 위한 필수 아이템들을 추천드려요. 경험 부스터는 꼭 사세요!", "buyer"},
		{"버그 제보", "퍼즐 챌린지에서 가끔 멈추는 현상이 있는 것 같아요.", "testuser"},
	}

	for _, post := range posts {
		_, err := db.Exec(`
			INSERT INTO posts (title, content, author_username, created_at, updated_at)
			VALUES ($1, $2, $3, NOW(), NOW())
		`, post.title, post.content, post.author)
		if err != nil {
			return fmt.Errorf("failed to seed post %s: %w", post.title, err)
		}
	}

	return nil
}


func cleanData(db *sql.DB) {
	fmt.Println("🧹 샘플 데이터만 정리 중...")

	// Only delete sample/test data, not all data
	testUsernames := []string{"testuser", "admin", "gamer1", "gamer2", "buyer"}
	
	// Delete related data for test users first (due to foreign key constraints)
	for _, username := range testUsernames {
		// Clean game scores
		db.Exec("DELETE FROM game_scores WHERE player_username = $1", username)
		
		// Clean game sessions
		db.Exec("DELETE FROM game_sessions WHERE player_username = $1", username)
		
		// Clean comments
		db.Exec("DELETE FROM comments WHERE author_username = $1", username)
		
		// Clean posts
		db.Exec("DELETE FROM posts WHERE author_username = $1", username)
		
		// Clean messages
		db.Exec("DELETE FROM messages WHERE sender_id = $1", username)
		
		// Clean friend relationships
		db.Exec("DELETE FROM friends WHERE user_id = $1 OR friend_id = $1", username)
		
		// Clean refresh tokens
		db.Exec("DELETE FROM refresh_tokens WHERE user_id = $1", username)
	}
	
	// Delete test games (sample games we created)
	testGames := []string{"피투피 배틀", "멀티 서바이벌", "퍼즐 챌린지", "레이싱 매니아", "타워 디펜스"}
	for _, gameName := range testGames {
		db.Exec("DELETE FROM games WHERE name = $1", gameName)
	}
	
	// Delete test users last
	for _, username := range testUsernames {
		if _, err := db.Exec("DELETE FROM users WHERE username = $1", username); err != nil {
			log.Printf("⚠️  사용자 %s 삭제 실패: %v", username, err)
		} else {
			fmt.Printf("  🗑️  테스트 사용자 %s 삭제 완료\n", username)
		}
	}

	fmt.Println("✅ 샘플 데이터 정리 완료! (실제 사용자 데이터는 보존됨)")
}

func hardCleanData(db *sql.DB) {
	fmt.Println("🚨 전체 데이터베이스 정리 중... (⚠️  모든 데이터가 삭제됩니다!)")

	tables := []string{
		"game_scores", "game_sessions", "games",
		"comments", "posts", 
		"messages", "chat_rooms",
		"friends", "refresh_tokens", "users",
	}

	for _, table := range tables {
		if _, err := db.Exec(fmt.Sprintf("DELETE FROM %s WHERE 1=1", table)); err != nil {
			log.Printf("⚠️  테이블 %s 정리 실패: %v", table, err)
		} else {
			fmt.Printf("  🗑️  %s 테이블 정리 완료\n", table)
		}
	}

	fmt.Println("✅ 전체 데이터베이스 정리 완료!")
}

func printHelp() {
	fmt.Println(`
🎮 PittuRu 더미 데이터 시딩 도구

사용법:
  go run cmd/seed/main.go -action=<command>

명령어:
  seed       - 샘플 데이터를 데이터베이스에 추가
  clean      - 샘플/테스트 데이터만 삭제 (실제 사용자 데이터 보존)
  hard-clean - 모든 데이터를 삭제 (⚠️ 위험!)  
  reset      - 샘플 데이터 삭제 후 재시딩 (안전)
  hard-reset - 모든 데이터 삭제 후 재시딩 (⚠️ 위험!)
  help       - 이 도움말 표시

생성되는 샘플 데이터:
  👤 테스트 사용자 5명 (testuser, admin, gamer1, gamer2, buyer)
  🎮 게임 5개 (피투피 배틀, 멀티 서바이벌 등)
  📝 커뮤니티 게시글 5개
  🛒 상점 아이템 6개

테스트 계정:
  - testuser / password123 (일반 사용자)
  - admin / admin123 (관리자)
  - gamer1, gamer2 / gamer123 (게이머)
  - buyer / buyer123 (구매자)

예시:
  go run cmd/seed/main.go -action=seed       # 샘플 데이터 추가
  go run cmd/seed/main.go -action=clean      # 샘플 데이터만 삭제 (안전)
  go run cmd/seed/main.go -action=hard-clean # 모든 데이터 삭제 (위험!)
  go run cmd/seed/main.go -action=reset      # 샘플 리셋 후 재시딩 (안전)
  go run cmd/seed/main.go -action=hard-reset # 완전 리셋 후 재시딩 (위험!)

🔒 프론트엔드 연동 시 권장사항:
  - 개발 중: clean, reset 사용 (실제 데이터 보존)
  - 완전 초기화 필요시에만: hard-clean, hard-reset 사용
`)
}