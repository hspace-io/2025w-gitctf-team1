###############################################################################
# Git-based CTF
###############################################################################
#
# Author: SeongIl Wi <seongil.wi@kaist.ac.kr>
#         Jaeseung Choi <jschoi17@kaist.ac.kr>
#         Sang Kil Cha <sangkilc@kaist.ac.kr>
#
# Copyright (c) 2018 SoftSec Lab. KAIST
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

# Don't Touch
FROM i386/debian:latest

# Install your package here
# RUN sed -i 's/deb.debian.org/ftp.daumkakao.com/g' /etc/apt/sources.list -> 에러
# 경로를 sources.list -> sources.list.d/debian.sources 로 변경
# RUN sed -i 's/deb.debian.org/ftp.daumkakao.com/g' /etc/apt/sources.list.d/debian.sources -> 에러
# 그냥 지움

# 32비트 환경이므로 호환성을 위해 기본 저장소의 nodejs를 설치합니다.
RUN apt-get update && \
    apt-get install -y nodejs npm curl && \
    apt-get clean

# 작업 디렉터리 설정
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# Don't Touch
RUN mkdir -p /var/ctf
COPY flag /var/ctf/

# Build and run your service here
# 포트 노출 및 서버 실행
EXPOSE 4000
CMD ["node", "app.js"]