const { SlashCommandBuilder } = require("discord.js");

//deletes all challenges if user is owner
module.exports = {
    data: new SlashCommandBuilder()
        .setName("delc")
        .setDescription("Deletes all challenges!"),
    async execute(interaction) {
        await interaction.deferReply();
        let { currentClient } = require("../../db/mongo.js");
        currentClient = currentClient();
        await currentClient.connect();
        const db = currentClient.db("challenges");
        const challenges = await db.collection("active").find({}).toArray();
        if (
            interaction.user.id == "738346395416789022" ||
            interaction.user.id == "881165769231192095"
        ) {
            await db.collection("active").deleteMany({});
            currentClient.close();
            interaction.followUp({
                content: "All challenges deleted!",
            });
            //delete all channels in fight category
            interaction.guild.channels.cache
                .filter((channel) => channel?.parent?.name == "fights")
                .forEach((channel) => channel.delete());

            return;
        }

        currentClient.close();
        return interaction.followUp({
            content: "You are not the owner!",
        });
    },
};
