const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const canalID = '1305640632278323323';
const sentMessagesFilePath = 'src/data/sentMessages.json';

// Charger les ID des messages sauvegardés
const loadSentMessages = () => {
    try {
        const data = fs.readFileSync(sentMessagesFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {}; // Retourne un objet vide si le fichier n'existe pas
    }
};

// Chargement des données utilisateurs
const loadJobData = () => {
    const data = fs.readFileSync('src/data/job_data.json', 'utf8');
    return JSON.parse(data);
};

// Sauvegarder les ID des messages dans le fichier
const saveSentMessages = (sentMessages) => {
    fs.writeFileSync(sentMessagesFilePath, JSON.stringify(sentMessages, null, 2), 'utf8');
};

// Fonction pour afficher les niveaux de tous les métiers
async function showAllProgress(interaction) {
    // Charger les ID des messages sauvegardés
    let sentMessages = loadSentMessages();

    // Charger les données utilisateurs
    const jobData = loadJobData();
    const maxLevel = 200;
    const progressBarLength = 40;

    // Cherche le canal pour afficher les progrès
    const progressChannel = await interaction.client.channels.fetch(canalID);

    // Parcours des métiers
    for (const jobIndex in jobData) {

        // Création d'un embed pour afficher les niveaux
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Progression des ' + jobIndex)
            .setDescription('Voici les niveaux de tous les farmeurs de ' + jobIndex);

        // Ajout des utilisateurs et de leurs progrès dans l'embed
        for (const userIndex in jobData[jobIndex]) {
            // Calcul de la barre de progression
            const progress = Math.min(Math.floor((jobData[jobIndex][userIndex].level / maxLevel) * progressBarLength), progressBarLength);
            const empty = progressBarLength - progress;
            const progressBar = '█'.repeat(progress) + '░'.repeat(empty);

            embed.addFields({
                name: jobData[jobIndex][userIndex].username,
                value: `**Progrès :** ${progressBar}\n**Niveau actuel :** ${jobData[jobIndex][userIndex].level}/${maxLevel}`,
                inline: false
            });
        }

        // Vérifier si un message pour ce métier a déjà été envoyé
        if (sentMessages[jobIndex]) {
            // Si un message existe, l'éditer
            const existingMessage = await progressChannel.messages.fetch(sentMessages[jobIndex]);
            await existingMessage.edit({ embeds: [embed] });
        } else {
            // Si aucun message n'existe, envoyer un nouveau message
            const sentMessage = await progressChannel.send({ embeds: [embed] });
            // Stocker la référence du message envoyé pour ce métier
            sentMessages[jobIndex] = sentMessage.id;
        }
    }

    // Sauvegarder les ID des messages envoyés dans le fichier
    saveSentMessages(sentMessages);
}

module.exports = { showAllProgress };