module.exports = {
    execute: async (data, interaction, client) => {
        await interaction.deferReply();
        let winnerId = data.split("/")[0];
        let propsalUserId = data.split("/")[1];
        console.log(data);
        console.log(winnerId, propsalUserId, interaction.user.id);
        //check if user is proposal sender
        if (propsalUserId == interaction.user.id) {
            return interaction.followUp({
                content: "You can't decline your own proposal!",
            });
        }

        //delete message button was clicked on
        (
            await interaction.channel.messages.fetch(interaction.message.id)
        ).delete();

        //send a message tagging the other user and saying that the user has confirmed the winner
        let message = await interaction.followUp({
            content: `<@${propsalUserId}> ${
                interaction.user.username
            } has declined that **${
                winnerId == interaction.user.id ? "he" : "you"
            }** ${
                winnerId == interaction.user.id ? "is" : "are"
            } the winner of the duel!\nIf you want an admin to decide the winner use the command \`/decideWinner\` and enter the match id`,
        });
    },
};
