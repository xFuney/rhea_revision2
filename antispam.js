'use strict';

// Antispam
// Funey, 2020.

const LR = require('./log');
const Logger = new LR('antispam');

module.exports = function(Client, Discord) {
    // init mute tables
    var Muted = new Set();
    var SpamCheck = new Set();

    // Allow hooking to msg event.
    this.ProcessMessage = function(message) {
        // check muting will work.
        message.TimeLog.muteProcessStart = Date.now();
        let Store = new Client.Libraries.Database(message.guild.id);
        let muteRoleID = Store.NPgetObject('mute-role');
        if (!muteRoleID) return;
        
        // check if user is muted.
        let mucheck = this.isMuted(message.guild.id, message.author.id);
        
        // If user is already muted, don't bother muting them *again*.
        if (mucheck) return;

        

        SpamCheck.add(message.guild.id + "_" + message.author.id + "_" + message.channel.id + "_" + message.id)

        setTimeout( () => {
            SpamCheck.delete(message.guild.id + "_" + message.author.id + "_" + message.channel.id + "_" + message.id)
        }, 2000)

        let amount = 0;

        SpamCheck.forEach( (element) => {
            let t = element.split('_');

            if (t[1] == message.author.id && t[0] == message.guild.id) {
                amount++
            };
        })

        if (amount > 3) {
            Logger.log(`Antispam mute triggered by user ID ${message.author.id} in ${message.guild.id} (aka ${message.guild.name}).`);
            SpamCheck.forEach ( (check) => {
                let checking = check.split('_');
                if (checking[0] == message.guild.id && checking[1] == message.author.id) {
                    // Find and delete this message.
                    try {
                        message.guild.channels.cache.get(checking[2]).messages.cache.get(checking[3]).delete().catch( () => {
                            Logger.log(`Failed to delete message ${checking[3]} in channel ${checking[2]}, guild ID ${message.guild.id}.`, 2)
                        })
                    } catch {
                        Logger.log(`Failed to delete message ${checking[3]} in channel ${checking[2]}, guild ID ${message.guild.id}.`, 2)
                    }
                    
                }
            })
            this.mute(message.guild.id, message.author.id, Client.user.id, '[AUTOMOD] Antispam', Client.Configuration.DefaultMuteDuration);
        }

        // Silently kill store.
        Store.silentKill();
        message.TimeLog.muteProcessEnd = Date.now();
    }

    this.mute = function(guildID, userID, modID, reason, duration) {
        // check if user is muted.
        let mucheck = this.isMuted(guildID, userID);
        //console.log(mucheck)

        //If user is already muted, don't bother muting them *again*.
        if (mucheck) return;

        let Store = new Client.Libraries.Database(guildID);

        let muteRoleID = Store.NPgetObject('mute-role');
        if (!muteRoleID[0]) return;
        try {
            let guild = Client.guilds.cache.get(guildID);
            let member = guild.members.cache.get(userID);
            //let xmod = guild.members.cache.get(modId);

            let role = guild.roles.cache.get(muteRoleID[0].value);

            member.roles.add(role).catch(console.error);

            Muted.add(guildID + '_' + userID + '_' + duration);

            Client.Libraries.Infractions.addInfraction(guildID, userID, modID, 'mute', reason, duration).then( () => {
                // They've been sent their mute notification.
                Logger.log(`User ${userID} muted in guild ${guildID}.`);
                setTimeout( () => {
                    this.unmuteUser(guildID, userID, modID, '[AUTOMOD] Automated unmute.', duration)
                }, duration)
                Store.silentKill();
            })
        } catch (err) {
            // failed mute
            Logger.log('Failed to mute user - could not add role!', 2);
            console.log(err)
        }



    }

    this.unmuteUser = function(guildID, userID, unmuterID, reason, duration) {
        Muted.delete(guildID + '_' + userID + '_' + duration);

        let Store = new Client.Libraries.Database(guildID);
        let muteRoleID = Store.NPgetObject('mute-role');
        try {
            let guild = Client.guilds.cache.get(guildID);
            let member = guild.members.cache.get(userID);

            let role = guild.roles.cache.get(muteRoleID[0].value);

            member.roles.remove(role).catch(console.error);

            Client.Libraries.Infractions.addInfraction(guildID, userID, unmuterID, 'unmute', reason).then( () => {
                Logger.log(`User ${userID} unmuted OK in ${guildID}.`);
                Store.silentKill();
            })
        } catch (err) {
            Logger.log('Failed to remove mute role from user ' + userID + ' in guild ' + guildID + '.', 2)
            console.log(err)
            Store.silentKill();
        }
    }

    this.isMuted = function(guildID, userID) {
        let f = false
        Muted.forEach( (element) => {
            let tmp = element.split('_')
            //console.log(element)
            if (tmp[0] == guildID && tmp[1] == userID) {
                f = tmp;
                
            }
        })

        return f;
    }
}