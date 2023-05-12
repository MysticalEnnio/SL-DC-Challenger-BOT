const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

//deletes all challenges if user is owner
module.exports = {
    data: new SlashCommandBuilder()
        .setName("admin-decide")
        .setDescription("Let an admin decide the winner of the duel!")
        .addStringOption((option) =>
            option
                .setName("code")
                .setDescription("Match Code")
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        let code = interaction.options.getString("code");
        if (!code) {
            return interaction.followUp({
                content: "Error! No code provided!",
            });
        }
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
        let guildData = await currentClient
            .db("guilds")
            .collection("data")
            .findOne({ id: challenge.guildId });
        if (!guildData.fightAdminChannel) {
            currentClient.close();
            return interaction.followUp({
                content:
                    "Error! No fight admin channel set! Please contact an admin to set the fight admin channel with the command `/set-admin-fight-channel`",
                ephemeral: true,
            });
        }

        //add challenge to adminDecide in challenges
        let adminDecide = await db.collection("adminDecide").findOne({
            challengeId: challenge._id,
        });
        if (adminDecide) {
            currentClient.close();
            return interaction.followUp({
                content: "Error! Admin has already been notified!",
            });
        }
        await db.collection("adminDecide").insertOne({
            challengeId: challenge._id,
            channelId: interaction.channelId,
            guildId: challenge.guildId,
        });
        (
            await interaction.guild.channels.fetch(guildData.fightAdminChannel)
        ).send({
            content: `${interaction.user.username} has requested an admin to decide the winner of the duel!\n\n**Match Code:** ${code}\n\n**Select Winner**`,
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `decideWinner-${challenge._id}/${challenge.challengerId}`
                            )
                            .setLabel(challenge.challengerName)
                            .setStyle(ButtonStyle.Primary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `decideWinner-${challenge._id}/${challenge.challengedId}`
                            )
                            .setLabel(challenge.challengedName)
                            .setStyle(ButtonStyle.Primary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`decideWinnerInvalid-${challenge._id}`)
                            .setLabel("Invalid Code")
                            .setStyle(ButtonStyle.Danger)
                    ),
            ],
        });

        interaction.followUp({
            content: "Admin has been notified!",
        });
        currentClient.close();
    },
};
