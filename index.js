const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const helpCommand = require('./commands/help.js');
const handleCommand = require('./commands/handle.js');
const practiceCommand = require('./commands/practice.js');
const standingsCommand = require('./commands/standings.js');
const duelCommand = require('./commands/duels.js');
const { resetUserDatabase, resetDuelDatabase } = require('./commands/reset_db.js');
const { upcomingContests, contestReminder, standingsDisplay, ratingUpdate } = require('./commands/reminders.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = ';';

const link = process.env.DB_LINK;
mongoose.connect(link, {
}).then(() => {
    console.log(" Connected to MongoDB");
}).catch(err => {
    console.error(" MongoDB connection error:", err);
});

client.once('ready', async () => {
    setInterval(async () => {
        try{
            await upcomingContests();
            await contestReminder(client);
            await standingsDisplay(client);
            await ratingUpdate(client);
        }
        catch(err){
            console.error("Runtime error:", err);
        }
    }, 10000);
    setInterval(async () => {
        try{
            await resetUserDatabase(client);
            await resetDuelDatabase();
        }
        catch(err){
            console.error("Runtime error:", err);
        }
    }, 7200000);
});

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith(PREFIX)) return;

    const command = message.content.trim().substring(1).split(/\s+/);
    try{
        if(command[0] === 'help') await helpCommand(message);
        if(command[0] === 'handle') await handleCommand(command, message);
        if(command[0] === 'practice') await practiceCommand(command, message);
        if(command[0] === 'standings') await standingsCommand(command, message);
        if(command[0] === 'duel') await duelCommand(command, message, client);
    }
    catch(err){
        console.error("Runtime error in command:", err);
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription('Something went wrong.');
        await message.channel.send({embeds: [embed]});  
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);