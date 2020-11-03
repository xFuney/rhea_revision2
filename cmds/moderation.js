'use strict';

let LA = require('../log')
let Logger = new LA('moderation');

//const moment = require('moment');

function getUserFromMention(mention) {
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return mention;
	}
}

module.exports = {
    'name': 'Moderation',
    'description': 'Moderation commands.',
    'commands': {}
}

module.exports.commands['warn'] = {
    'pretty_name': 'warn <user-id> <reason>',
    'description': 'Warn a user.',
    'exec_function': function(message, args, Discord, client) {
        // Check if user ID is present.
        if (args[0] === undefined) return message.channel.send('**ERROR: Need to specify user ID.**');
        if (!message.guild) return;
        if (!message) return;
        if (!message.guild.owner) return;

        if (!message.member.hasPermission('KICK_MEMBERS')) return message.channel.send('**FAIL**: Insufficient permissions.')

        var uid = args[0]

        if (args[0].length != 18) {
            //console.log("poo")
            uid = getUserFromMention(args[0]);
        }

        var VerifyUserExists = client.users.cache.some(user => user.id === uid);

        if (!VerifyUserExists) {
            // User doesn't exist.
            return message.channel.send('**FAIL**: User is not a member of this guild.')
        }

        var user = message.guild.member(uid);

        //console.log(message.member)
        if (message.author.id != message.guild.owner.id) {
            if (message.member.roles.highest.comparePositionTo(user.roles.highest) <= 0) {
                // Oop.
                return message.channel.send('**FAIL**: Cannot kick as user has higher role than you.')
            }
        } 

        let reasonMsg = args.slice(1,args.length).join(" ");

        reasonMsg = reasonMsg === "" ? "No reason specified" : reasonMsg;

        client.Libraries.Infractions.addInfraction(message.guild.id, uid, message.author.id, 'warn', reasonMsg).then( (infSendOk) => {
            if (!infSendOk) {
                message.channel.send('**SUCCESS**: User warned successfully, but has DMs disabled and has not received an infraction notice.')
            } else {
                message.channel.send('**SUCCESS**: User warned successfully.')  
            }
            
        });
    }
}

module.exports.commands['kick'] = {
    'pretty_name': 'kick <user-id> <reason>',
    'description': 'Kick a user.',
    'exec_function': function(message, args, Discord, client) {
        // Check if user ID is present.
        if (args[0] === undefined) return message.channel.send('**ERROR: Need to specify user ID.**');
        if (!message.member.hasPermission('KICK_MEMBERS')) return message.channel.send('**FAIL**: Insufficient permissions.')

        var uid = args[0]

        if (args[0].length != 18) {
            //console.log("poo")
            uid = getUserFromMention(args[0]);
        }

        var VerifyUserExists = client.users.cache.some(user => user.id === uid);

        if (!VerifyUserExists) {
            // User doesn't exist.
            return message.channel.send('**FAIL**: User is not a member of this guild.')
        }

        var user = message.guild.member(uid);

        //console.log(message.member)
        if (message.author.id != message.guild.owner.id) {
            if (message.member.roles.highest.comparePositionTo(user.roles.highest) <= 0) {
                // Oop.
                return message.channel.send('**FAIL**: Cannot kick as user has higher role than you.')
            }
        } 

        let reasonMsg = args.slice(1,args.length).join(" ");

        reasonMsg = reasonMsg === "" ? "No reason specified" : reasonMsg;

        client.Libraries.Infractions.addInfraction(message.guild.id, uid, message.author.id, 'kick', reasonMsg).then( (infSendOk) => {

            message.guild.members.cache.get(uid).kick(reasonMsg).then( () => {
                if (!infSendOk) {
                    message.channel.send('**SUCCESS**: User kicked successfully, but had DMs off so did not receive an infraction notice.');
                } else {
                    message.channel.send('**SUCCESS**: User kicked successfully.');
                }
            }).catch( () => {
                message.channel.send('**FAIL:** Could not kick user - they will, however, have a kick infraction.')
            })
            
        });
    }
}

module.exports.commands['ban'] = {
    'pretty_name': 'ban <user-id> <reason>',
    'description': 'Ban a user.',
    'exec_function': function(message, args, Discord, client) {
        // Check if user ID is present.
        if (args[0] === undefined) return message.channel.send('**ERROR: Need to specify user ID.**');
        if (!message.member.hasPermission('BAN_MEMBERS')) return message.channel.send('**FAIL**: Insufficient permissions.')

        var uid = args[0]

        if (args[0].length != 18) {
            //console.log("poo")
            uid = getUserFromMention(args[0]);
        }

        var VerifyUserExists = client.users.cache.some(user => user.id === uid);

        if (!VerifyUserExists) {
            // User doesn't exist.
            return message.channel.send('**FAIL**: User is not a member of this guild.')
        }

        var user = message.guild.member(uid);

        //console.log(message.member)
        if (message.author.id != message.guild.owner.id) {
            if (message.member.roles.highest.comparePositionTo(user.roles.highest) <= 0) {
                // Oop.
                return message.channel.send('**FAIL**: Cannot ban as user has higher role than you.')
            }
        } 

        let reasonMsg = args.slice(1,args.length).join(" ");

        reasonMsg = reasonMsg === "" ? "No reason specified" : reasonMsg;

        client.Libraries.Infractions.addInfraction(message.guild.id, uid, message.author.id, 'ban', reasonMsg).then( (infSendOk) => {

            message.guild.members.cache.get(uid).ban(reasonMsg).then( () => {
                if (!infSendOk) {
                    message.channel.send('**SUCCESS**: User banned successfully, but had DMs off so did not receive an infraction notice.');
                } else {
                    message.channel.send('**SUCCESS**: User banned successfully.');
                }
            }).catch( (err) => {
                console.log(err)
                message.channel.send('**FAIL:** Could not ban user - they will, however, have a ban infraction.')
            })
            
        });
    }
}