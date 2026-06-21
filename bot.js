const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(port, () => {
  console.log(`Health check server listening on port ${port}`);
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
