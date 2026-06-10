# GitHub 연결 방법 설명

## 실제 동작 구성 (2026-06-10 기준)

이 환경에서 GitHub MCP는 **Claude 공식 플러그인** 방식으로 연결되어 있습니다.

| 도구 | 결과 | 비고 |
|------|------|------|
| `mcp__github__*` (표준 MCP) | ❌ 401 Bad credentials | 별도 서버 미설정 |
| `mcp__plugin_github_github__*` (플러그인) | ✅ 정상 동작 | 현재 사용 중 |

---

## 현재 설정 구조

### 1. 토큰 등록 — `~/.claude/settings.json`

```json
{
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxx..."
  }
}
```

Claude Code 전역 설정의 `env` 블록에 PAT를 등록합니다.  
이 값이 플러그인에 자동으로 전달됩니다.

### 2. 플러그인 활성화 — `.claude/settings.json` (프로젝트)

```json
{
  "enabledPlugins": {
    "github@claude-plugins-official": true
  }
}
```

프로젝트 디렉토리의 설정 파일에서 GitHub 플러그인을 활성화합니다.

### 3. 플러그인 MCP 설정 (자동 생성)

```
~/.claude/plugins/cache/claude-plugins-official/github/unknown/.mcp.json
```

```json
{
  "github": {
    "type": "http",
    "url": "https://api.githubcopilot.com/mcp/",
    "headers": {
      "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
    }
  }
}
```

플러그인 설치 시 자동 생성됩니다. `api.githubcopilot.com/mcp/`는 GitHub Copilot MCP 엔드포인트입니다.

---

## 처음 설정하는 방법

### Step 1. GitHub Personal Access Token 발급

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. `Generate new token` 클릭
3. 필요한 권한 선택:
   - `repo` (저장소 읽기/쓰기)
   - `workflow` (Actions 사용 시)
4. 토큰 복사 (한 번만 표시됨)

### Step 2. 토큰을 Claude 전역 설정에 등록

```bash
# ~/.claude/settings.json 의 env 블록에 추가
```

```json
{
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_발급받은토큰"
  }
}
```

> **주의**: 토큰을 `.mcp.json`이나 프로젝트 파일에 직접 쓰지 마세요. `~/.claude/settings.json`은 홈 디렉토리에 있어 git에 올라가지 않습니다.

### Step 3. GitHub 플러그인 설치

Claude Code에서:
```
/plugins install github
```

또는 프로젝트 `.claude/settings.json`에 직접 추가:
```json
{
  "enabledPlugins": {
    "github@claude-plugins-official": true
  }
}
```

### Step 4. 연결 확인

Claude Code에서 다음처럼 요청하면 됩니다:
```
내 GitHub 계정 정보 알려줘
```
→ `kwonsunbin` 사용자 정보가 반환되면 정상 연결된 것입니다.

---

## 플러그인으로 사용 가능한 작업

`mcp__plugin_github_github__*` 도구를 통해 아래 작업을 자연어로 수행할 수 있습니다.

- **파일 push**: `push_files` — 여러 파일을 한 커밋으로 push
- **파일 조회**: `get_file_contents`
- **이슈**: `list_issues`, `issue_read`, `issue_write`
- **PR**: `create_pull_request`, `pull_request_read`, `merge_pull_request`
- **브랜치**: `create_branch`, `list_branches`
- **검색**: `search_code`, `search_repositories`, `search_issues`

---

## 표준 MCP 서버 방식 (Docker, 미사용)

Docker 기반의 공식 GitHub MCP 서버를 직접 실행하는 대안적 방법입니다.  
현재 이 환경에서는 사용하지 않습니다.

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

이 방식은 `.mcp.json`(프로젝트 루트) 또는 `claude_desktop_config.json`에 작성합니다.  
Docker가 필요하며, 플러그인 방식보다 설정이 복잡합니다.

---

## 보안 주의사항

- **토큰을 채팅에 직접 붙여넣기 금지** — 대화 기록에 남습니다
- 토큰은 `~/.claude/settings.json`의 `env` 블록에만 저장하세요
- 실수로 토큰이 노출됐다면 즉시 GitHub에서 해당 토큰을 Revoke하고 재발급하세요
- `settings.json`은 절대 git에 커밋하지 마세요

---

## 요약

```
현재 동작 흐름:
~/.claude/settings.json 의 env.GITHUB_PERSONAL_ACCESS_TOKEN
    → Claude Code가 플러그인에 환경변수 전달
    → github@claude-plugins-official 플러그인
    → api.githubcopilot.com/mcp/ 로 HTTP 연결
    → mcp__plugin_github_github__* 도구로 GitHub 작업 수행
```
