const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(port, () => {
  console.log(`Health check server listening on port ${port}`);
});

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

client.login(process.env.TOKEN);
