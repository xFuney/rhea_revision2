'use strict'

// Discord API handler
// Funey 2020
const Discord = require('discord.js');

module.exports = function(token) {
  // Check if token exists before diving in the deep end.

  if (!process.env.RHEA_TOKEN && !token) {
    
  }

  const Client = new Discord.Client();
  Client.Configuration = require('./config.json');
  Client.Libraries = [];
  Client.Libraries.Database = require('./db');
  Client.Libraries.Logging = require('./log');
  Client.Libraries.ProcessMessage = require('./msg_process')
  Client.Libraries.CommandMgmt = require('./cmd_mgmt.js')
  
  Client.TimeKeeping = [];
  Client.TimeKeeping.Average = [];
  
  Client.PresenceMessage = [];
  Client.PresenceMessage.Messages = Client.Configuration.PresenceMessages
  Client.PresenceMessage.OnMessage = 0;

  let inf = require('./infractions')
  let ant = require('./antispam')
  Client.Libraries.Infractions = new inf(Client, Discord);
  Client.Libraries.Antispam = new ant(Client, Discord); 
  
  Client.Libraries.CommandMgmt.Initialise(Client);

  const HandlerLog = new Client.Libraries.Logging('discord');

  Client.on('ready', () => {
    HandlerLog.log(`Rhea is connected to Discord, with name ${Client.user.tag}.`)
    Client.user.setActivity(`Bot Initialised OK - operating in ${Client.guilds.cache.size} guilds.`)
    setInterval( () => {
      if (Client.PresenceMessage.OnMessage == Client.PresenceMessage.Messages.length - 1) {
        Client.PresenceMessage.OnMessage = 0;
      } else {
        Client.PresenceMessage.OnMessage++;
      }
  
      Client.user.setActivity(`${Client.PresenceMessage.Messages[Client.PresenceMessage.OnMessage]} - operating on ${Client.guilds.cache.size} guilds.`)
    }, 120000)

  })



  Client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.guild === null) return;
    if (oldMessage.author.bot) return;

    let MsgProcess = Client.Libraries.ProcessMessage(Client, Discord, newMessage);
    if (!MsgProcess.ok) {
      // Triggered.
      HandlerLog.log(`Message blacklist triggered (reason: ${MsgProcess.reason}).`);
      // Delete message.
      newMessage.delete();
      return Client.Libraries.Infractions.addInfraction(newMessage.guild.id, newMessage.author.id, Client.user.id, "warn", MsgProcess.reason)
    };

    let Store = new Client.Libraries.Database(oldMessage.guild.id);

    Store.getObject('message-log').then( (v) => {
      // v[0].value is the ID.
      var channelID = v[0].value.toString();
      
      let JoinEmbed = new Discord.MessageEmbed()
          .setColor('#ffff00')
          .setTitle("Message edited in #" + oldMessage.channel.name)
          .setAuthor(oldMessage.author.tag + " (" + oldMessage.author.id + ")", oldMessage.author.displayAvatarURL())
          .addField('Old Message', oldMessage.content)
          .addField('New Message', newMessage.content)
          .setFooter('Message ID: ' + oldMessage.id)
          .setTimestamp();
      
      Client.guilds.cache.get(oldMessage.guild.id).channels.cache.get(channelID).send(JoinEmbed);
    }).catch( (err) => {
      //console.log(err);
    })
  });

  Client.on('messageDelete', (msg) => {
    if (msg.author.bot) return;
    
    if (msg.guild === null) return; // Potential API issue?
    
    let Store = new Client.Libraries.Database(msg.guild.id);
    
    Store.getObject('message-log').then( (v) => {
        // v[0].value is the ID.
        var channelID = v[0].value.toString();
    
        let JoinEmbed = new Discord.MessageEmbed()
            .setColor('#ff0000')
            .setTitle("Message deleted in #" + msg.channel.name)
            .setAuthor(msg.author.tag + " (" + msg.author.id + ")", msg.author.displayAvatarURL())
            .setDescription(msg.content)
            .setFooter('Message ID: ' + msg.id)
            .setTimestamp();
    
        Client.guilds.cache.get(msg.guild.id).channels.cache.get(channelID).send(JoinEmbed);
    }).catch( (err) => {
        HandlerLog.error('Error encountered while trying to add to message log for guild ' + msg.guild.id, 2)
        HandlerLog.error(err);
    })
  })

  Client.on('message', (message) => {
    // Message sent.
    // Request start, log time.
    let TimeLogger = [];
    message.TimeLog = TimeLogger;
    if (message.guild === null) return;
    if (message.author.bot) return;
    message.TimeLog.blacklistProcessStart = Date.now();



    //console.log(message.guild.id)
    let MsgProcess = Client.Libraries.ProcessMessage(Client, Discord, message);
    if (!MsgProcess.ok) {
      // Triggered.
      HandlerLog.log(`Message blacklist triggered (reason: ${MsgProcess.reason}).`);
      // Delete message.
      message.delete();
      return Client.Libraries.Infractions.addInfraction(message.guild.id, message.author.id, Client.user.id, "warn", MsgProcess.reason)
    }

    Client.Libraries.Antispam.ProcessMessage(message);

    message.TimeLog.blacklistProcessed = Date.now();

    if (TimeLogger.blacklistProcessed - TimeLogger.blacklistProcessStart > 1000) {
      HandlerLog.log('Blacklist processing on Guild ID ' + message.guild.id + ' taking longer than usual (<1000ms expected, ' + (TimeLogger.blacklistProcessed - TimeLogger.blacklistProcessStart) + ' actual).')
    }

    // Process as command.

    if (!message.content.startsWith(Client.Configuration.Prefix)) return;
    

    message.TimeLog.commandProcessStart = Date.now();

    const ARGS = message.content.slice(Client.Configuration.Prefix.length).trim().split(/ +/g);
    const CMD = ARGS.shift().toLowerCase();

    Client.Commands.forEach( (element) => {
      //HandlerLog.log(element)
      if (element.commands[CMD] !== undefined) {
          // Command exists.
          //Logger.log('Command executed: ' + command)
          message.TimeLog.commandExecuted = Date.now();
          if (Client.Timekeeping.Average !== undefined) {
            if (Client.Timekeeping.Average.length > 9) {
              Client.Timekeeping.Average = [];
              Client.Timekeeping.Average.push((message.TimeLog.blacklistProcessed - message.TimeLog.blacklistProcessStart) + (message.TimeLog.muteProcessEnd - message.TimeLog.muteProcessStart) + (message.TimeLog.commandExecuted - message.TimeLog.commandProcessStart))
            } else {
              // load.
              let avg = 0;
              Client.Timekeeping.Average.forEach( (num) => {
                avg += num
              })
  
              avg = avg / Client.Timekeeping.Average.length
  
              message.TimeLog.AverageNine = avg;
            }
          }


          Client.Timekeeping.Average.push((message.TimeLog.blacklistProcessed - message.TimeLog.blacklistProcessStart) + (message.TimeLog.muteProcessEnd - message.TimeLog.muteProcessStart) + (message.TimeLog.commandExecuted - message.TimeLog.commandProcessStart))

          if (message.TimeLog.AverageNine > 300) {
            HandlerLog.log(`General message processing taking longer than usual! (avg. last 9 requests >300ms to process)`);
          }
          return element.commands[CMD].exec_function(message, ARGS, Discord, Client);
      }
    })

  });

  Client.login(process.env.RHEA_TOKEN)
}
/*module.exports = function() {
  const client = new Discord.Client();
  const fs = require('fs');

  client.config = require('./config.json');

  // Now that we initialised that, start the parsing.
  client.Commands = new Set();
  const CommandsDir = fs.readdirSync('./cmds/').filter(file => file.endsWith('.js'));
    
  for (const Files of CommandsDir) {
      let temp = require('./cmds/' + Files);
    
      client.Commands.add(temp)
  }

  client.on('message', (message) => {
    console.log(`[DEBUG]: Received message.`);
        
  let args = message.content.slice(client.CONFIG.prefix.length).trim().split(/ +/g);
  let command = args.shift().toLowerCase();
        
  // Do command handling.

  })
}
*/