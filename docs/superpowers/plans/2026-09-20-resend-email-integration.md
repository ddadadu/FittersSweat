# 실제 이메일 수신 연동 (Resend HTTPS API) 구현 계획서

> 작성일: 2026-09-20  
> 목표: Railway 클라우드 방화벽을 우회하여 실제 사용자 수신함(Gmail, Naver 등)으로 1초 내에 회원가입 인증 메일 실시간 발송

---

## 1. 개요 및 배경

- **문제점**: Railway, AWS 등 클라우드 PaaS는 스팸 방지를 위해 모든 TCP SMTP 포트(25, 465, 587)의 아웃바운드를 호스트 레벨에서 차단하여 `Connection timeout` 발생.
- **해결책**: 포트 443(HTTPS REST API)을 사용하는 클라우드 표준 이메일 발송 엔진 **Resend** 도입.
- **3-Tier 아키텍처**:
  1. `RESEND_API_KEY` 존재 시: **Resend HTTPS REST API (Port 443)**로 실제 이메일 1초 내 즉시 발송.
  2. 로컬 개발 환경: **Nodemailer SMTP** 보조 지원.
  3. API 실패/오프라인: **Graceful Demo Fallback**으로 시연/테스트 무중단 보장.

---

## 2. 작업 태스크

1. **Backend**:
   - `resend` SDK 패키지 설치
   - `EmailService`에 Resend HTTPS API 우선 발송 로직 구현
   - 환경변수 `RESEND_API_KEY` 연동
2. **테스트 및 검증**:
   - 단위 테스트 검증
   - 실제 수신함 발송 E2E 테스트
