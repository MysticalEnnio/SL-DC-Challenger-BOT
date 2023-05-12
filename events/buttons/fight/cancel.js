const ObjectId = require("mongodb").ObjectId;

module.exports = {
    execute: async (challengeId, interaction, client) => {
        await interaction.deferReply();
        //check if command is in a channel in fight category
        if (!interaction.channel.parent.name.toLowerCase() == "fights") {
            return interaction.followUp({
                content: "This command can only be used in a fight channel!",
                ephemeral: true,
            });
        }
        let { currentClient } = require("../../../db/mongo.js");
        currentClient = currentClient();

        //check if userId is in database
        await currentClient.connect();
        //get challenge from database
        const db = currentClient.db("challenges");
        const challenge = await db.collection("active").findOne({
            _id: new ObjectId(challengeId),
        });
        console.log(challengeId, challenge);
        let guildData = await currentClient
            .db("guilds")
            .collection("data")
            .findOne({ id: challenge.guildId });
        if (!challenge) {
            currentClient.close();
            return interaction.followUp("Error! Challenge not found!");
        }
        if (!guildData.fightArchiveCategory) {
            currentClient.close();
            return interaction.followUp(
                "Error! No fight archive category set! Please contact an admin to set the fight-archive category with the command `/setfightcategory"
            );
        }

        require("../../../modules/fight/cancel.js").execute(
            currentClient,
            interaction,
            client,
            challengeId,
            challenge,
            ObjectId
        );
    },
};
