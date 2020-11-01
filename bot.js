const { Client } = require('discord.js');
const Discord = require('discord.js');

const client = new Client();

client.config = require('./config.json');

const getUser = async (guildid, userid) => {
    // try to get guild from all the shards
    const req = await client.shard.broadcastEval(`this.guilds.get(${guildid})`);

    console.log(req)
    // return non-null response or false if not found
    return (req.find((res) => !!res) || false);
}

client.on('ready', info => {
  let shards = "";
  let i = 0;
  console.log(`Bot ready on shard(s) ${client.shard.ids.join(',')}`)
})

client.on('message', message => {
	if (!message.content.startsWith(client.config.prefix) || message.author.bot) return;

	const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

  if (command == "profile") {
            if (args[0] === undefined) args[0] = message.author.id;

        if (message.mentions.members.first()) {
            // Is mention.
            args[0] = message.mentions.members.first().id
        } else {
            // Check if user ID is the message author first, otherwise don't do anything
            if (args[0] != message.author.id) {
                // Is a standard args[1] id. but check first.
                if (args[0].length != 18) {
                    args[0] = message.author.id
                } else {
                    // Is an actual ID!
                    args[0] = args[0]
                }
            }
        }

        // User has permission.
        //var VerifyUserExists = client.users.cache.some(user => user.id === args[0]);

        var VerifyUserExists = getUser(message.guild.id, args[0]).then( (usergot) => {
        console.log(usergot);

        if (!usergot) {
            // User doesn't exist.
            return message.channel.send('**FAIL**: User is not a member of this guild.')
        }

        const ONE_DAY = 1000 * 60 * 60 * 24;

        //var user = message.guild.member(args[0]);

        var user = usergot;

        let joinDate = new Date(user.joinedTimestamp);
        let createDate = new Date(user.user.createdAt);

        let createDays = Math.round(Math.abs(new Date() - createDate) / ONE_DAY);
        let joinDays = Math.round(Math.abs(new Date() - joinDate) / ONE_DAY);

        const profileEmbed = new Discord.MessageEmbed()
            .setColor('7289da')
            .setAuthor('User Information')
            .setDescription(`Cached user information for <@!${user.user.id}>:`)
            .setThumbnail(user.user.displayAvatarURL())
            .setTimestamp()
            .addField('Username', user.user.tag, true)
            .addField('User ID', user.user.id, true)
            .addField('Status', user.user.presence.status, true)
            .addField('Highest Rank', user.roles.highest.name, true)
            .addField('Created', createDate.toUTCString() + " (" + createDays + " days ago)", true)
            .addField('Joined', joinDate.toUTCString() + " (" + joinDays + " days ago)", true);

            message.channel.send(profileEmbed);        
        });


  }
});

client.login(process.env.RHEA_TOKEN);