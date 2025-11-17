const db = require("../db.cjs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "default_insecure_secret_key";

const authController = {
    // 회원가입
    signup: async (req, res) => {
        try {
            const { username, password, name, alias, nickname, schoolName, clubName } = req.body;
            // nickname을 우선 사용, 없으면 alias, 둘 다 없으면 name
            const userAlias = nickname || alias || name;

            // 중복 아이디 확인 
            const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            
            if (existingUser) {
                return res.status(400).json({ 
                    success: false,
                    message: "이미 존재하는 아이디입니다." 
                });
            }

            // 비밀번호 암호화
            const hashedPassword = await bcrypt.hash(password, 10);

            // UUID 생성
            const userId = crypto.randomUUID();

            // 유저 생성, isAdmin은 0(false)으로 기본 설정
            const insertQuery = db.prepare(`
                INSERT INTO users (id, username, password, name, alias, schoolName, clubName, isAdmin, isClubStaff)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            insertQuery.run(userId, username, hashedPassword, name, userAlias, schoolName, clubName, 0, 0);

            res.status(201).json({ 
                success: true,
                message: "회원가입 성공", 
                userId: userId 
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false,
                message: "서버 에러" 
            });
        }
    },

    // 로그인
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            // 유저 조회
            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: "아이디 또는 비밀번호가 틀렸습니다." 
                });
            }

            // 비밀번호 검증
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false,
                    message: "아이디 또는 비밀번호가 틀렸습니다." 
                });
            }

            // 토큰 발급 
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    isAdmin: !!user.isAdmin,
                    alias: user.alias || null
                },
                JWT_SECRET,
                { expiresIn: "2h" }
            );

            res.json({
                success: true,
                message: "로그인 성공",
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    alias: user.alias || null,  // alias가 없으면 null 반환
                    schoolName: user.schoolName,
                    clubName: user.clubName,
                    isAdmin: !!user.isAdmin,
                    isClubStaff: !!user.isClubStaff
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false,
                message: "서버 에러" 
            });
        }
    }
};

module.exports = {
    authController,
    JWT_SECRET
};