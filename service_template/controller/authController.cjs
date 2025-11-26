const db = require("../db.cjs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "default_insecure_secret_key";

const authController = {
    signup: async (req, res) => {
        try {
            const { username, password, name, alias, nickname, schoolName, clubName } = req.body;
            const userAlias = nickname || alias || name;

            const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            
            if (existingUser) {
                return res.status(400).json({ 
                    success: false,
                    message: "이미 존재하는 아이디입니다." 
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const userId = crypto.randomUUID();

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

    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: "아이디 또는 비밀번호가 틀렸습니다." 
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false,
                    message: "아이디 또는 비밀번호가 틀렸습니다." 
                });
            }

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
                success: true,
                message: "로그인 성공",
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    alias: user.alias || null,
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