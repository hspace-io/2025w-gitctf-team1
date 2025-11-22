const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 아직은 하드코딩 했지만 실제 배포할 때는 .env로 할게요~
const JWT_SECRET = "hspace_ctf_secret_key_secure_version";

const authController = {
    // 회원가입
    signup: async (req, res) => {
        try {
            const { username, password, name, schoolName, clubName } = req.body;

            // 중복 아이디 확인 
            const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            
            if (existingUser) {
                return res.status(400).json({ message: "이미 존재하는 아이디입니다." });
            }

            // 비밀번호 암호화
            const hashedPassword = await bcrypt.hash(password, 10);

            // 유저 생성, isAdmin은 0(false)으로 기본 설정
            const insertQuery = db.prepare(`
                INSERT INTO users (username, password, name, schoolName, clubName, isAdmin)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            const info = insertQuery.run(username, hashedPassword, name, schoolName, clubName, 0);

            // info.lastInsertRowid 로 생성된 ID 확인 가능
            res.status(201).json({ message: "회원가입 성공", userId: info.lastInsertRowid });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "서버 에러" });
        }
    },

    // 로그인
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            // 유저 조회
            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

            if (!user) {
                return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });
            }

            // 비밀번호 검증
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });
            }

            // 토큰 발급 
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    isAdmin: !!user.isAdmin 
                },
                JWT_SECRET,
                { expiresIn: "2h" }
            );

            res.json({
                message: "로그인 성공",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    isAdmin: !!user.isAdmin
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "서버 에러" });
        }
    }
};

module.exports = authController;