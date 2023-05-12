const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-admin-fight-channel")
        .setDescription("Set the fight admin channel")
        .addChannelOption((option) =>
            option
                .setName("admin-fight-channel")
                .setDescription("admin-fight-channel")
                .setRequired(true)
        ),
    async execute(interaction) {
        //check if interaction was written in a server
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "You can only use this command in a server!",
                ephemeral: true,
            });
        }
        let channel = interaction.options.getChannel("admin-fight-channel");
        console.log("channel", channel);
        if (!channel.isText()) {
            return interaction.reply({
                content: "You need to select a text channel!",
                ephemeral: true,
            });
        }
        //check if interaction user is guild admin
        if (!interaction.member.permissions.has("ADMINISTRATOR")) {
            return interaction.reply({
                content: "You need to be a guild admin to use this command!",
                ephemeral: true,
            });
        }
        let { currentClient } = require("../../db/mongo.js");
        currentClient = currentClient();
        //ping users databse
        await currentClient.connect();
        //check if user is already in database
        const db = currentClient.db("guilds");
        let guild = await db
            .collection("data")
            .findOne({ id: interaction.guild.id });
        if (!guild) {
            await db.collection("data").insertOne({
                id: interaction.guild.id,
                fightAdminChannel: channel.id,
            });
        } else {
            await db.collection("data").updateOne(
                { id: interaction.guild.id },
                {
                    $set: {
                        fightAdminChannel: channel.id,
                    },
                }
            );
        }
        await currentClient.close();
        //send confirmation message
        await interaction.reply({
            content: "fight-admin-channel set!",
            ephemeral: true,
        });
    },
};
