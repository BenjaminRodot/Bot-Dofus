const fs = require('fs');

// Fonction pour sauvegarder les données d'un utilisateur
async function saveUserData(userData) {
    // Charger les données existantes

    let data = {};

    try {
        const rawData = fs.readFileSync('./src/data/job_data.json', 'utf8');
        data = JSON.parse(rawData);
    } catch (error) {
        console.log('Aucune donnée existante ou erreur de lecture :', error);
    }

    // Vérifier si le métier existe déjà dans les données
    if (!data[userData.job]) {
        // Si le métier n'existe pas, le créer
        data[userData.job] = {};
    }

    data[userData.job][userData.userId] = {
        username: userData.username,
        level: userData.level
    };

    try {
        fs.writeFileSync('./data/job_data.json', JSON.stringify(data, null, 2), 'utf8');
        console.log(`Données sauvegardées pour l'utilisateur ${userData.username} (ID: ${userData.userId})`);
    } catch (error) {
        console.log('Erreur lors de la sauvegarde des données :', error);
    }
}

module.exports = { saveUserData };