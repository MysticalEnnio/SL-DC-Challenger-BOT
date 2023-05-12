const { Events } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(client, interaction) {
        console.log("InteractionCreate event fired!");
        switch (interaction.type) {
            case 2:
                const command = interaction.client.commands.get(
                    interaction.commandName
                );

                if (!command) {
                    console.error(
                        `No command matching ${interaction.commandName} was found.`
                    );
                    return;
                }

                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({
                            content:
                                "There was an error while executing this command!",
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content:
                                "There was an error while executing this command!",
                            ephemeral: true,
                        });
                    }
                }
                break;
            case 3:
                let buttonCommand = interaction.customId.slice(
                    0,
                    interaction.customId.indexOf("-")
                );

                let buttonData = interaction.customId.slice(
                    interaction.customId.indexOf("-") + 1
                );
                console.log(
                    interaction.customId +
                        " was clicked by " +
                        interaction.user.tag
                );
                switch (buttonCommand) {
                    case "accept":
                        require("./buttons/fight/accept.js").execute(
                            buttonData,
                            interaction,
                            client
                        );
                        break;
                    case "decline":
                        require("./buttons/fight/decline.js").execute(
                            buttonData,
                            interaction,
                            client
                        );
                        break;
                    case "cancel":
                        require("./buttons/fight/cancel.js").execute(
                            buttonData,
                            interaction,
                            client
                        );
                        break;
                    case "acceptWinnerProposal":
                        require("./buttons/fight/acceptWinnerProposal.js").execute(
                            buttonData,
                            interaction,
                            client
                        );
                        break;
                    case "declineWinnerProposal":
                        require("./buttons/fight/declineWinnerProposal.js").execute(
                            buttonData,
                            interaction,
                            client
                        );
                        break;
                    case "decideWinner":
                        require("./buttons/fight/decideWinner.js").execute(
                            buttonData,
                            interaction,
                            client
                        );
                        break;
                    case "decideWinnerInvalid":
                        require("./buttons/fight/decideWinnerInvalid.js").execute(
                            buttonData,
                            interaction,
                            client
                        );
                        break;
                    case "AcceptTime":
                        require("./buttons/fight/acceptTime.js").execute(
                            buttonData,
                            interaction,
                            client
                        );
                        break;
                    default:
                        console.log("Button command not found", buttonCommand);
                        break;
                }
                break;
            case 5:
                let modalType = interaction.customId.slice(
                    0,
                    interaction.customId.indexOf("-")
                );
                let modalId = interaction.customId.slice(
                    interaction.customId.indexOf("-") + 1
                );
                console.log(
                    modalType + " was clicked by " + interaction.user.tag
                );
                switch (modalType) {
                    default:
                        console.log("Modal type not found: " + modalType);
                        break;
                }
                break;
            default:
                console.log("Interaction type not found: " + interaction.type);
                break;
        }
    },
};
