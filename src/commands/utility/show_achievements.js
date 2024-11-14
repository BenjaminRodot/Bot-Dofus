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

        // Créer un embed pour afficher les succès
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`Succès de ${interaction.user.username}`)
            .setDescription("Liste des succès disponibles. Les succès non obtenus sont marqués avec ⬛.");

        // Parcourir chaque succès dans achievement_list (qui est maintenant un tableau)
        for (const achievement of achievements) {
            const hasAchievement = userAchievements[userId]?.some(ach => ach.name === achievement.name);

            // Affiche l'emoji lié ou un carré noir si l'utilisateur ne possède pas le succès
            embed.addFields({
                name: `${hasAchievement ? achievement.emoji : '⬛'} ${achievement.name}`,
                value: achievement.description,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
