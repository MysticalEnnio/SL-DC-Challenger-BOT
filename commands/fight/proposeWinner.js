const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

//deletes all challenges if user is owner
module.exports = {
    data: new SlashCommandBuilder()
        .setName("propose-winner")
        .setDescription("Propose a winner for the duel!")
        .addUserOption((option) =>
            option.setName("user").setDescription("Winner").setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        let { currentClient } = require("../../db/mongo.js");
        currentClient = currentClient();
        await currentClient.connect();
        const db = currentClient.db("challenges");
        let challenge = await db.collection("active").findOne({
            channelId: interaction.channelId,
        });
        if (!challenge) {
            currentClient.close();
            return interaction.followUp({
                content: "Error! Challenge not found!",
            });
        }

        //check if proposed user is in challenge
        let proposedWinner = interaction.options.getUser("user");
        if (
            proposedWinner.id != challenge.challengerId &&
            proposedWinner.id != challenge.challengedId
        ) {
            currentClient.close();
            return interaction.followUp({
                content: "Error! Proposed winner is not in challenge!",
            });
        }

        //send message in channel with accept and decline buttons so that the other user can accept or decline
        let channel = interaction.guild.channels.cache.get(challenge.channelId);
        await interaction.followUp({
            content: `<@${
                interaction.user.id == challenge.challengerId
                    ? challenge.challengedId
                    : challenge.challengerId
            }> ${interaction.user.username} has proposed that **${
                proposedWinner.id == interaction.user.id ? "he" : "you"
            }** ${
                proposedWinner.id == interaction.user.id ? "is" : "are"
            } the winner of the duel!`,
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `acceptWinnerProposal-${proposedWinner.id}/${interaction.user.id}`
                            )
                            .setLabel("Confirm")
                            .setStyle(ButtonStyle.Primary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `declineWinnerProposal-${proposedWinner.id}/${interaction.user.id}`
                            )
                            .setLabel("Deny")
                            .setStyle(ButtonStyle.Danger)
                    ),
            ],
        });
    },
};
