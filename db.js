'use strict';

// Databasing
// Funey, 2020

const sqlite = require('better-sqlite3');
const LOG = require('./log');

const Logger = new LOG('database');
Logger.log('Database Management is initialised.')

module.exports = function(guildID) {
    let inUse = true;
    let dead = false;
    
    const db = new sqlite('./datastore/' + guildID + '.db');

    // Initialise this guild's DataStore if it doesn't exist.
    db.exec(`CREATE TABLE IF NOT EXISTS "infractions" (
        "infractionID"	INTEGER,
        "userID"	TEXT,
        "moderatorID"	TEXT,
        "type"	TEXT,
        "reason"	TEXT,
        "timestamp"	INTEGER,
        PRIMARY KEY("infractionID")
    );`);

    db.exec(`CREATE TABLE IF NOT EXISTS "config" (
        "property"	TEXT,
        "value"	TEXT,
        PRIMARY KEY ("property")
    );`)

    // Set the in use counter to false if this instance isn't in use.
    setTimeout( () => {
        inUse = false;
    }, 10000);

    setInterval( () => {
        // If not in use...
        if (!inUse && !dead) {
            // Kill this database instance.
            Logger.log('Killing database instance (reason: usage timeout)', 1)
            db.close();
            dead = true;
        }
    }, 15000);

    this.silentKill = function() {
        // Silently take care of the database.
        db.close();
        dead = true;
    }

    this.NPgetInfractionsByID = function(infractionID) {
        if (infractionID === undefined) return false;

        try {
            let stmt = db.prepare('SELECT infractionID, userID, moderatorID, type, reason, timestamp FROM infractions WHERE infractionID = ?').all(infractionID);
            //console.log(stmt)

            return stmt;
        } catch {
            return false;
        }
    }

    this.generateInfractionID = function() {
        let bRunning = true;
        let ID = 0;

        Logger.log(`Generating an infraction ID.`)
        while (bRunning) {
            // Generate a random ID between 1 and 4294967295 (max uint_32 value)
            ID = Math.floor((Math.random() * 4294967295) + 1);

            if (this.NPgetInfractionsByID(ID).length == 0) {
                // We're OK to use this one, since it doesn't exist.
                Logger.log(`Exiting thought loop.`)
                bRunning = false;
            }
        }

        Logger.log(`Created a valid, unique infraction ID (${ID}).`)
        return ID;
    }

    this.addInfraction = function(guildID, punishedID, moderatorID, type, reason) {
        return new Promise( (resolve, reject) => {
            Logger.log(`Attempting to add infraction...`)

           //console.log(userId)
           //console.log(modId)

            if (type === undefined || punishedID === undefined || moderatorID === undefined) {
                Logger.log(`Missing argument - rejected.`, 2)
                reject()
            };

            reason = reason || "No reason specified." // If no reason is specified, set the reason to say such.
    
            let infID = this.generateInfractionID();
            let stamp = Math.round((new Date()).getTime() / 1000);
    
            try {
                db.prepare(`INSERT INTO infractions (infractionID, userID, moderatorID, type, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)`).run(infID, punishedID, moderatorID, type, reason, stamp);
                Logger.log(`Added OK, resolved.`)
                resolve(infID);
            } catch {
                Logger.log(`Failed for some reason - rejected.`, 2)
                reject();
            }
        })
    }

    this.getObject = function(property) {
        return new Promise ( (resolve, reject) => {
            try {
                let stmt = db.prepare('SELECT value FROM config WHERE property = ?').all(property);
                //console.log(stmt)
                resolve(stmt);
            } catch (err) {
                console.log(err);
                reject();
            }
        })
    }

    this.NPgetObject = function(property) {
        try {
            let stmt = db.prepare('SELECT value FROM config WHERE property = ?').all(property);
            //console.log(stmt)
            //resolve(stmt);
            return stmt;
        } catch (err) {
            console.log(err);
            //eject();
            return false;
        }
    }

    this.getInfractionsByUser = function(userId) {

        return new Promise( (resolve, reject) => {
            if (userId === undefined) reject();
            try {
                let stmt = db.prepare('SELECT infractionID, userID, moderatorID, type, reason, timestamp FROM infractions WHERE userID = ?').all(userId);
                resolve(stmt);
            } catch {
                reject();
            }
        })

    }

    this.updateObject = function(property, value) {
        return new Promise( (resolve, reject) => {
            try {
                let val = value.toString();
                db.prepare(`
                INSERT INTO config (property, value) 
                    VALUES (?, ?)
                    ON CONFLICT (property) DO UPDATE SET
                        value = excluded.value
                    WHERE property = ?
                `).run(property, val, property)

                resolve();
            } catch {
                Logger.log(`Failed to update object for some reason - rejected.`, 2)
                reject();
            }
        })

    }
}
