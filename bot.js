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

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
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
