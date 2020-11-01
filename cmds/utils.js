'use strict';

module.exports = {
    'name': 'Utilities',
    'description': 'Test Utilities.',
    'commands': {}
}

module.exports.commands['ping'] = {
    'pretty_name': 'ping',
    'description': 'Get ping.',
    'exec_function': function(message, args, Discord, client) {
        let TotalTime = (message.TimeLog.blacklistProcessed - message.TimeLog.blacklistProcessStart) + (message.TimeLog.muteProcessEnd - message.TimeLog.muteProcessStart) + (message.TimeLog.commandExecuted - message.TimeLog.commandProcessStart)
        let Embed = new Discord.MessageEmbed()
            .setColor('#0000ff')
            .setTitle("Pong!")
            .setDescription("Connection between this guild and the bot is OK.")
            .addField('Blacklist Process Time', (message.TimeLog.blacklistProcessed - message.TimeLog.blacklistProcessStart) + 'ms', false)
            .addField('Mute Process Time', (message.TimeLog.muteProcessEnd - message.TimeLog.muteProcessStart) + 'ms', false)
            .addField('Command Fetch/Execute Time', (message.TimeLog.commandExecuted - message.TimeLog.commandProcessStart) + "ms", false)
            .addField('Total Time Taken', TotalTime + 'ms', false)
            .addField('Average Request Time (last 9)', message.TimeLog.AverageNine, false)
            .setAuthor(client.Configuration.BotName, client.Configuration.BotPicture);

        message.channel.send(Embed)
        //message.channel.send(`Pong!\n**__Latency__**\nBlacklist Processing: ${message.TimeLog.blacklistProcessed - message.TimeLog.blacklistProcessStart}ms\nMute Processing: ${message.TimeLog.muteProcessEnd - message.TimeLog.muteProcessStart}ms\nCommand Processing: ${message.TimeLog.commandExecuted - message.TimeLog.commandProcessStart}ms\n\nTotal Time Taken: ${TotalTime}ms`)
    }
}

module.exports.commands['help'] = {
    'pretty_name': 'help',
    'description': 'Get help.',
    'exec_function': function(message, args, Discord, client) {
        if (args[0]) {
            let HelpEmbed = new Discord.MessageEmbed()
                .setColor('#0000ff')
                .setTitle(client.Configuration.BotName + " Help - " + args[0])
                .setAuthor(client.Configuration.BotName, client.Configuration.BotPicture);

            let exists = false;

            client.Commands.forEach( (element, index) => {
                if (element.name.toLowerCase() == args[0].toLowerCase()) {
                    // Correct category.
                    exists = true;
                    for (const cmd in element.commands) {
                        HelpEmbed.addField(client.Configuration.Prefix + element.commands[cmd].pretty_name, element.commands[cmd].description)
                    }

                } else {
                    // nothing.
                }
            });

            if (!exists) {
                HelpEmbed.addField('Error', 'Category does not exist.');
            }

            message.channel.send(HelpEmbed);            
        } else {
            let HelpEmbed = new Discord.MessageEmbed()
                .setColor('#0000ff')
                .setTitle(client.Configuration.BotName + " Help")
                .setAuthor(client.Configuration.BotName, client.Configuration.BotPicture);

            client.Commands.forEach( (element) => {
                HelpEmbed.addField(element.name, element.description);
            })

            message.channel.send(HelpEmbed);
        }

    }
}