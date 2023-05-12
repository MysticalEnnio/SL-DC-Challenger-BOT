const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-fight-category")
        .setDescription(
            "Set the id for fight category where channels for fights will be created"
        )
        .addStringOption((option) =>
            option
                .setName("id")
                .setDescription("Id of the fight category")
                .setRequired(true)
        ),
    async execute(interaction) {
        categoryId = interaction.options.getString("id");
        //check if categoryId is only numbers
        if (isNaN(categoryId)) {
            return interaction.reply({
                content: "Category id must be only numbers!",
                ephemeral: true,
            });
        }

        //check if interaction was written in a server
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "You can only use this command in a server!",
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
                fightCategory: categoryId,
            });
        } else {
            await db.collection("data").updateOne(
                { id: interaction.guild.id },
                {
                    $set: {
                        fightCategory: categoryId,
                    },
                }
            );
        }
        await currentClient.close();
        //send confirmation message
        await interaction.reply({
            content: "Fight category set!",
            ephemeral: true,
        });
    },
};
