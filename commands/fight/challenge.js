const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("challenge")
        .setDescription("Challenge a user to a fight!")
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("User to challenge(e.g. user#0000)")
        )
        .setRequired(true),
    async execute(interaction) {
        //check if interaction was written in a server
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "You can only use this command in a server!",
                ephemeral: true,
            });
        }
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
        //verify if user is format user#0000
        let challengedUser = interaction.options.getString("user");
        if (!challengedUser) {
            return interaction.reply({
                content: "Please specify a user to challenge!",
                ephemeral: true,
            });
        }
        //use regex to verify if user is in correct format (anything#0000)
        let regex = /.*#\d{4}/;
        if (!regex.test(challengedUser)) {
            return interaction.reply({
                content: "Please specify a user in the correct format!",
                ephemeral: true,
            });
        }
        //verify if user is in server
        let guild = interaction.guild;
        console.log(JSON.stringify(guild.members.cache, null, 2));
        let member = guild.members.cache.find(
            (member) => member.user.tag === challengedUser
        );
        if (!member) {
            return interaction.reply({
                content: "That user is not in this server!",
                ephemeral: true,
            });
        }
        //push user to challengedUsers array in database
        await db
            .collection("data")
            .updateOne(
                { id: interaction.user.id },
                { $push: { challengedUsers: member.user.id } }
            );
        //send challenge message to challenged user
        const challengeEmbed = new EmbedBuilder()
            .setTitle("You have been challenged to a fight!")
            .setDescription(
                `${interaction.user.username} has challenged you to a fight!`
            )
            .setColor("#91a1e3");
        await member.send({ embeds: [challengeEmbed] });
        //send confirmation message to challenger
        await interaction.reply({
            content: `You have challenged ${member.user.username} to a fight!`,
            ephemeral: true,
        });
        await currentClient.close();
    },
};
