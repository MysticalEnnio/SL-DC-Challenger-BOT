const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Show your stats!"),
    async execute(interaction) {
        let { currentClient } = require("../../db/mongo.js");
        currentClient = currentClient();
        //ping users databse
        await currentClient.connect();
        //check if user is already in database
        const db = currentClient.db("users");
        let user = await db
            .collection("data")
            .findOne({ id: interaction.user.id });
        if (!user || !user.joinedGuild) {
            await currentClient.close();
            return interaction.reply(
                "You havent joined the Adventure Guild yet!"
            );
        }
        await currentClient.close();
        const statsEmbed = new EmbedBuilder()
            .setTitle(`${user.name}'s Stats`)
            .setDescription(
                `Rank: ${user.rank}\nPower: ${user.power}\nLevel: ${user.level}\nExp: ${user.exp}\nFights: ${user.fights}\nWins: ${user.wins}\nLosses: ${user.losses}`
            )
            .setColor("#91a1e3");
        await interaction.reply({ embeds: [statsEmbed] });
    },
};
