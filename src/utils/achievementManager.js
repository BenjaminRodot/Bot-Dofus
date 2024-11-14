const fs = require('fs');
const path = require('path');

// Chemin vers le fichier JSON où seront sauvegardés les succès
const filePath = path.join(__dirname, '../data/achievement_list.json');

// Charger les succès existants depuis le fichier
const loadAchievements = () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Retourne un tableau vide si le fichier n'existe pas encore
        return [];
    }
};

// Sauvegarde les succès dans le fichier
const saveAchievements = (achievements) => {
    fs.writeFileSync(filePath, JSON.stringify(achievements, null, 2), 'utf8');
};

// Créer un nouvel objet succès
const createAchievement = (name, description, emoji) => {
    return {
        name: name,
        description: description,
        emoji: emoji
    };
};

// Ajouter un succès et le sauvegarder dans le fichier
const addAchievement = (name, description, emoji) => {
    // Charger les succès existants
    const achievements = loadAchievements();

    // Créer un nouvel objet succès
    const newAchievement = createAchievement(name, description, emoji);

    // Ajouter le succès à la liste
    achievements.push(newAchievement);

    // Sauvegarder les succès mis à jour
    saveAchievements(achievements);

    console.log(`Succès "${name}" ajouté avec succès !`);
};

module.exports = { addAchievement };
