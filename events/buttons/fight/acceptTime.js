const ObjectId = require("mongodb").ObjectId;

module.exports = {
    execute: async (data, interaction, client) => {
        await interaction.deferReply();

        let challengeId = data.split("/")[0];
        let proposerId = data.split("/")[1];

        if (interaction.user.id == proposerId) {
            return interaction.followUp({
                content: "You can't accept your own time suggestion!",
            });
        }
        let currentClient = require("../../../db/mongo.js").currentClient();
        await currentClient.connect();
        //get challenge
        const db = currentClient.db("challenges");
        let challenge = await db.collection("active").findOne({
            _id: new ObjectId(challengeId),
        });
        if (!challenge) {
            currentClient.close();
            return interaction.followUp({
                content: "Error! Challenge not found!",
            });
        }

        //send message to user saying that the time for the challenge has been accepted
        let proposer = await client.users.fetch(proposerId);
        currentClient.close();
        proposer.send({
            content: `${interaction.user.username} has accepted the proposed time for your challenge!`,
        });
        interaction.followUp({
            content: `${interaction.user.username} has accepted the proposed time for the challenge!`,
        });
    },
};
