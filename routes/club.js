const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    try {
        const clubs = db.prepare(`
            SELECT id, schoolName, clubName, description, activities
            FROM Club
        `).all();

        return res.json({ success: true, data: clubs });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.get('/:id', (req, res) => {
    try {
        const clubId = req.params.id;

        if (!clubId || typeof clubId !== 'string') {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const club = db.prepare(`
            SELECT id, schoolName, clubName, description, activities
            FROM Club
            WHERE id = ?
        `).get(clubId);

        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const events = db.prepare(`
            SELECT id, title, category, field, eventDate, difficulty, recruitmentCount
            FROM Event
            WHERE clubName = ?
        `).all(club.clubName);

        return res.json({
            success: true,
            data: { ...club, events }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.get('/:id/members', (req, res) => {
    try {
        const clubId = req.params.id;

        const club = db.prepare(`
            SELECT clubName
            FROM Club
            WHERE id = ?
        `).get(clubId);

        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const members = db.prepare(`
            SELECT id, name, username, isClubStaff
            FROM User
            WHERE clubName = ?
        `).all(club.clubName);

        return res.json({
            success: true,
            data: members
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
