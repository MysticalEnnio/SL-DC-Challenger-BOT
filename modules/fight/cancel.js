module.exports = {
    execute: async (
        currentClient,
        interaction,
        client,
        challengeId,
        challenge,
        ObjectId
    ) => {
        //add challenge to archived
        await currentClient
            .db("challenges")
            .collection("archived")
            .insertOne({
                ...challenge,
                outcome: 0,
                outcomeText: "Fight cancelled",
            });
        //delete challenge from active
        await currentClient
            .db("challenges")
            .collection("active")
            .deleteOne({ _id: new ObjectId(challengeId) });

        //send confirmation message
        interaction.followUp("Challenge cancelled!");
        //remove write permissions from channel
        let channel = await client.channels.fetch(challenge.channelId);
        console.log(challenge.challengedId, challenge.challengerId);
        channel.permissionOverwrites.create(challenge.challengedId, {
            SendMessages: false,
            ViewChannel: true,
        });
        channel.permissionOverwrites.create(challenge.challengerId, {
            SendMessages: false,
            ViewChannel: true,
        });
        //move channel to fight-archive category
        await channel.setParent(guildData.fightArchiveCategory);
        currentClient.close();
    },
};
