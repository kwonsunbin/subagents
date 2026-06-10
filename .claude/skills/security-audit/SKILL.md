---
description: 보안 취약점 중심으로 코드를 감사합니다. OWASP Top 10 기준으로 분석합니다.
---

Perform a security audit on: $ARGUMENTS

Focus areas (check all that apply):
- **Injection** — SQL, command, LDAP injection; unsanitized user input passed to interpreters
- **Broken Auth** — plain-text passwords, weak tokens, missing expiry, session fixation
- **Sensitive Data Exposure** — credentials in logs/errors, unencrypted storage, overly verbose error messages
- **Access Control** — missing authorization checks, privilege escalation, IDOR (insecure direct object references)
- **Security Misconfiguration** — default credentials, exposed debug info, overly permissive CORS/headers
- **Dependency Issues** — known-vulnerable packages (check package.json if present)
- **Cryptographic Issues** — weak algorithms, hardcoded secrets, predictable random values

Output format:
```
## Security Audit: <target>

### [CRITICAL] <vulnerability type>
File: path:line
Issue: ...
Impact: ...
Fix: ...

### [HIGH] ...
### [MEDIUM] ...
### [INFO] ...  ← observations that aren't vulnerabilities but worth noting

### Summary
Found: X critical, Y high, Z medium
Top priority fix: ...
```

Be specific — cite exact lines and show concrete exploit scenarios for critical findings.
