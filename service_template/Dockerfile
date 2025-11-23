###############################################################################
# Git-based CTF (Team 1 - Fast Node.js Service)
###############################################################################

# 1. Node.js 20 버전 공식 이미지 사용 (가볍고 빠름, 아키텍처 자동 맞춤)
FROM node:20-slim

# 2. 필수 패키지 설치
# sqlite3, bcrypt 등의 빌드를 위해 python3와 빌드 도구만 설치
RUN apt-get update && \
    apt-get install -y python3 build-essential curl && \
    apt-get clean

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 의존성 설치
COPY package*.json ./
RUN npm install

# 5. 소스 코드 복사
COPY . .

RUN npm run build

# 6. 플래그 파일 설정
RUN mkdir -p /var/ctf
COPY flag /var/ctf/

# 7. 실행 설정 (포트 변경: 4000 -> 5000)
EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

# 8. 서버 실행
CMD ["node", "app.cjs"]
