'use strict';

// Infraction Sysem
// Funey, 2020

const LOG = require('./log')
const Logger = new LOG('infraction')

function millisecondsToStr (milliseconds) {
    let moment = require('moment');
    //milliseconds = Date.now() + milliseconds;
    return moment.utc(moment.duration(milliseconds).as('milliseconds')).format('HH:mm:ss') + " (HH:MM:SS)"
}

module.exports = function(Client, Discord) {
    
    this.addInfraction = function(guildID, punishedID, moderatorID, type, reason, duration) {
        return new Promise( (resolve,reject) => {
            let Store = new Client.Libraries.Database(guildID);

            let guild = Client.guilds.cache.get(guildID);

            Store.addInfraction(guildID, punishedID, moderatorID, type, reason).then( (infractionID) => {
                // Now we can notify user.
                let WarnEmbed = new Discord.MessageEmbed()
                .setColor('#ff0000')
                .setTitle('New Infraction')
                .setAuthor(Client.Configuration.BotName, Client.Configuration.BotPicture)
                .setDescription('You have received an infraction in ' + guild.name + '.')
                .addField('Type', type, true)
                .addField('Infraction ID', infractionID, true)
                .addField('Reason', reason, true);

                if (type == 'mute') {
                    WarnEmbed.setDescription('You have received an infraction in ' + guild.name + '.')
                    WarnEmbed.addField('Duration', millisecondsToStr(duration));
                } else if (type == 'unmute') {
                    WarnEmbed.setDescription('Your infraction in ' + guild.name + ' has been updated.')
                } else {
                    WarnEmbed.setDescription('You have received an infraction in ' + guild.name + '.')
                }

                Client.users.cache.get(punishedID).send(WarnEmbed).then( () => {
                    Logger.log('Infraction alert sent to user ' + punishedID + ' successfully.')
                    Store.getObject('infraction-log').then( (v) => {
                        let warnedUser = Client.users.cache.get(punishedID);
                        let punisher = Client.users.cache.get(moderatorID);

                        let InfractionEmbed = new Discord.MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle('New infraction (type: ' + type + ') for ' + warnedUser.tag)
                        .setAuthor(Client.Configuration.BotName, Client.Configuration.BotPicture)
                        .addField('Punished', warnedUser.tag + " (" + punishedID + ")" , true)
                        .addField('Punisher', punisher.tag + " (" + moderatorID + ")", true)
                        .addField('Reason', reason , true);

                        if (type == 'mute') {
                            WarnEmbed.addField('Duration', millisecondsToStr(duration));
                        }
    
                        Client.guilds.cache.get(guildID).channels.cache.get(v[0].value.toString()).send(InfractionEmbed);
                    })
                    resolve(true);
                }).catch( (err) => {
                    Logger.log('Failed to send infraction alert to user ' + punishedID + '.', 2)
                    resolve(true)
                })
            })
        })
    }

}