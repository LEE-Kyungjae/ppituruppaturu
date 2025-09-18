// main.go - 레거시 호환성을 위한 파일 (새로운 프로젝트에서는 cmd/server/main.go 사용 권장)
package main

import (
	"log"
	"os"
	"os/exec"
)

func main() {
	log.Println("⚠️  주의: 이 파일은 레거시 호환성을 위한 것입니다.")
	log.Println("💡 새로운 구조에서는 'make run' 또는 'go run ./cmd/server'를 사용하세요.")
	
	// cmd/server/main.go를 실행
	cmd := exec.Command("go", "run", "./cmd/server")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	
	if err := cmd.Run(); err != nil {
		log.Fatalf("서버 실행 실패: %v", err)
	}
}