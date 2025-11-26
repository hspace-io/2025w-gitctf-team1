# 2025w-gitctf-team1
2025w-gitctf-team1

### 빌드 방법
```bash
$ cd ./service_template

$ npm run docker:build

$ cp .env.example .env

$ docker run -p 5000:5000 --env-file .env hacker-tone
```