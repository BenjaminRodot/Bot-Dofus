const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Chemins vers les fichiers de succès et d'achievements utilisateurs
const achievementListFilePath = path.join(__dirname, '../../data/achievement_list.json');
const userAchievementsFilePath = path.join(__dirname, '../../data/user_achievements.json');

// Charger la liste des succès
const loadAchievements = () => {
    try {
        const data = fs.readFileSync(achievementListFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show_achievements')
        .setDescription("Affiche tous les succès enregistrés, avec un carré noir si l'utilisateur ne l'a pas obtenu."),

    async execute(interaction) {
        const userId = interaction.user.id;

        // Charger les succès et les succès de l'utilisateur
        const achievements = loadAchievements();
        const userAchievements = loadUserAchievements();

        // Initialiser une chaîne pour contenir les succès
        let response = '';

        // Parcourir chaque succès dans achievements (qui est un tableau)
        for (const achievement of achievements) {
            const hasAchievement = userAchievements[userId]?.some(ach => ach.name === achievement.name);

            response += ` ${hasAchievement ? achievement.emoji : '⬛'}`;
        }
        await interaction.reply(response);
    }
};
