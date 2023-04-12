const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ag-join")
        .setDescription("Join the Adventure Guild!"),
    async execute(interaction) {
        await interaction.reply("Pong!");
    },
};
