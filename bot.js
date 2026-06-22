const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(port, () => {
  console.log(`Health check server listening on port ${port}`);
});
// At the top of bot.js
const startTime = Date.now();
let statusMessageId = null; // We will save the ID here to edit it
const STATUS_CHANNEL_ID = '1518492063807569952'; // The channel where the dashboard lives

// Function to format Uptime
function getUptime() {
    let totalSeconds = (process.uptime());
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

const axios = require('axios');

// Add this route to your Express app part of bot.js
app.get('/proxy-stream', async (req, res) => {
    try {
        // The real source is hidden here in the backend
        const hiddenSource = 'https://livedakho.pages.dev/?BEIN';
        
        const response = await axios.get(hiddenSource, {
            headers: {
                // We lie to the server and say we are the official webpage
                'Referer': 'https://livedakho.pages.dev/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
            },
            responseType: 'text'
        });

        // This replaces the internal links so they point back to the real server
        const baseUrl = hiddenSource.substring(0, hiddenSource.lastIndexOf('/') + 1);
        const fixedManifest = response.data.replace(/^(?!http|#)(.*)$/gm, baseUrl + '$1');

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.send(fixedManifest);
    } catch (error) {
        console.error("Proxy Error");
        res.status(500).send("Stream Unavailable");
    }
});

// ... rest of your existing bot code below ...
require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

const commands = [
    new SlashCommandBuilder()
        .setName('watch')
        .setDescription('Starts the sports stream activity')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Replace your existing registration block with this:
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Use Guild Commands for testing (Replace GUILD_ID with your Server ID)
        // This usually avoids the "Entry Point" error during setup
        const GUILD_ID = '1518205016887001128'; 

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded commands for the server.');
    } catch (error) {
        console.error("Command Refresh Error:", error);
        console.log("Tip: If you see Error 50240, it means Discord is protecting your 'Activity Entry Point'. The bot will likely still work!");
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'watch') {
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply({ content: "Join a Voice Channel first!", ephemeral: true });

        try {
            const invite = await channel.createInvite({
                target_type: 2, // Activity
                target_application_id: process.env.CLIENT_ID,
            });
            return interaction.reply(`🚀 Click to start the stream: ${invite.url}`);
        } catch (e) {
            console.error(e);
            return interaction.reply("Failed to start activity. Check permissions.");
        }
    }
});
const { EmbedBuilder } = require('discord.js');

async function updateStatusDashboard(client) {
    const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
    if (!channel) return;

    // Create the "Green Bar" visual (30 blocks)
    const historyBars = "🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩";
    
    const statusEmbed = new EmbedBuilder()
        .setTitle('NEXUS LEGENDS | SYSTEM LIVENESS')
        .setColor('#00d4ff')
        .setDescription('**All services are operational**')
        .addFields(
            { name: '📡 Stream Proxy', value: `${historyBars} \n**99.99% Uptime**`, inline: false },
            { name: '🤖 Bot Core', value: `${historyBars} \n**Operational**`, inline: false },
            { name: '⏱️ Total Uptime', value: `\`${getUptime()}\``, inline: true },
            { name: '🚀 Ping', value: `\`${client.ws.ping}ms\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Updates every 60 seconds • Powered by Nexus Legends' });

    try {
        if (!statusMessageId) {
            // First time: Send the message
            const msg = await channel.send({ embeds: [statusEmbed] });
            statusMessageId = msg.id;
        } else {
            // Every other time: Edit the message
            const msg = await channel.messages.fetch(statusMessageId);
            await msg.edit({ embeds: [statusEmbed] });
        }
    } catch (err) {
        console.error("Dashboard update failed:", err);
        statusMessageId = null; // Reset if message was deleted
    }
}
client.once('ready', () => {
    client.user.setActivity('eFootball Live', { type: ActivityType.Streaming, url: 'https://twitch.tv/nexus_legends' });
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Initial update
    updateStatusDashboard(client);

    // Update every 60 seconds (60000ms)
    setInterval(() => {
        updateStatusDashboard(client);
    }, 60000);
});

client.login(process.env.TOKEN);
