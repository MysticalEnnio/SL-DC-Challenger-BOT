const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ag-join")
        .setDescription("Join the Adventure Guild!"),
    async execute(interaction) {
        let { currentClient } = require("../../db/mongo.js");
        currentClient = currentClient();
        console.log(currentClient);
        //ping users databse
        await currentClient.connect();
        const db = currentClient.db("users");
        let user = await db
            .collection("data")
            .findOne({ id: interaction.user.id });
        if (!user) {
            await db.collection("data").insertOne({
                id: interaction.user.id,
                name: interaction.user.username,
                joinedGuild: true,
                rank: "F",
                rankNum: 0,
                exp: 0,
                level: 1,
            });
        } else {
            if (user.joinedGuild) {
                await currentClient.close();
                return interaction.reply({
                    content: "You are already in the Adventure Guild!",
                    ephemeral: true,
                });
            }
            await db
                .collection("data")
                .updateOne(
                    { id: interaction.user.id },
                    { $set: { joinedGuild: true } }
                );
        }
        await currentClient.close();
        //send confirmation message
        await interaction.reply({
            content: "You have joined the Adventure Guild!",
            ephemeral: true,
        });
        console.log("Connected to MongoDB and pinged the database!");
    },
};
