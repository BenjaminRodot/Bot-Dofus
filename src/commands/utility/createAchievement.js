const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addAchievement } = require('../../utils/achievementManager'); // Assurez-vous que le chemin est correct
const fs = require('fs');
const path = require('path');

// ID du salon de notification
const notificationChannelId = '1306076291551858769';

// Chemin vers le fichier pour enregistrer les succès des utilisateurs
const userAchievementsFilePath = path.join(__dirname, '../../data/user_achievements.json');

const saveSuccessMessage = (messageId, successName) => {
    const successMessages = loadSuccessMessages();
    successMessages[successName] = messageId;
    fs.writeFileSync('data/success_messages.json', JSON.stringify(successMessages, null, 2));
};

// Charger les messages enregistrés
const loadSuccessMessages = () => {
    try {
        const data = fs.readFileSync('data/success_messages.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};  // Si le fichier n'existe pas, renvoie un objet vide
    }
};

// Charger les succès des utilisateurs
const loadUserAchievements = () => {
    try {
        const data = fs.readFileSync(userAchievementsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

// Sauvegarder les succès des utilisateurs
const saveUserAchievements = (data) => {
    fs.writeFileSync(userAchievementsFilePath, JSON.stringify(data, null, 2), 'utf8');
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addachievement')
        .setDescription('Ajoute un succès avec un nom, une description et un emoji')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Le nom du succès')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('La description du succès')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Un emoji pour représenter le succès')
                .setRequired(true)),

    async execute(interaction) {
        const name = interaction.options.getString('nom');
        const description = interaction.options.getString('description');
        const emoji = interaction.options.getString('emoji');

        try {
            // Ajoute le succès
            addAchievement(name, description, emoji);
            await interaction.reply(`Succès "${name}" ajouté avec succès !`);

            // Envoie un message dans le salon de notification
            const channel = await interaction.client.channels.fetch(notificationChannelId);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setTitle(name)
                    .setDescription(description)
                    .setColor('#FFD700');

                const successMessage = await channel.send({ embeds: [embed] });
                saveSuccessMessage(successMessage.id, name);
                await successMessage.react(emoji);

                // Détecte les réactions et leur retrait sur le message
                const filter = (reaction, user) => reaction.emoji.name === emoji && !user.bot;
                const collector = successMessage.createReactionCollector({ filter, dispose: true, time: 24 * 60 * 60 * 1000 }); // 24 heures

                collector.on('collect', (reaction, user) => {
                    const userAchievements = loadUserAchievements();

                    // Ajouter le succès à l'utilisateur s'il ne l'a pas déjà
                    if (!userAchievements[user.id]) {
                        console.log("pas user");
                        userAchievements[user.id] = [];
                    }
                    if (!userAchievements[user.id].some(ach => ach.name === name)) {
                        userAchievements[user.id].push({ name, description, emoji });
                        saveUserAchievements(userAchievements);
                        console.log(`Succès "${name}" ajouté pour l'utilisateur ${user.username}.`);
                    }
                });

                // Gérer le retrait de la réaction
                collector.on('remove', (reaction, user) => {
                    const userAchievements = loadUserAchievements();

                    // Retirer le succès de l'utilisateur si existant
                    if (userAchievements[user.id]) {
                        userAchievements[user.id] = userAchievements[user.id].filter(ach => ach.name !== name);
                        saveUserAchievements(userAchievements);
                        console.log(`Succès "${name}" retiré pour l'utilisateur ${user.username}.`);
                    }
                });

            } else {
                console.error(`Salon avec l'ID ${notificationChannelId} introuvable.`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('Erreur lors de l\'ajout du succès.');
        }
    },
};
