const { EmbedBuilder } = require('discord.js');

const progressMessages = {};

async function showProgress(interaction, userData) {
    const { metier, level } = userData;
    const maxLevel = 200; // Exemple de niveau max
    const progressBarLength = 40; // Longueur de la barre de progression (en nombre de blocs)

    // Calcul de la barre de progression
    const progress = Math.min(Math.floor((level / maxLevel) * progressBarLength), progressBarLength);
    const empty = progressBarLength - progress;
    const progressBar = '█'.repeat(progress) + '░'.repeat(empty);

    // Création de l'embed
    const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle(`${metier} - Niveau ${level}`)
        .setDescription(`**Progres :** ${progressBar}\n**Niveau actuel :** ${level}/${maxLevel}`)
        .addFields({
            name: 'Metier', value: metier, inline: true
        })
        .addFields({
            name: 'Niveau', value: `${level} / ${maxLevel}`, inline: true
        })
        .setFooter({ text: `Mise a jour : ${new Date().toLocaleString()}` });

    // Vérifie si un message de progression existe déjà pour cet utilisateur
    if (progressMessages[userData.userId]) {
        // Si le message existe, on l'édite
        try {
            const existingMessage = await progressMessages[userData.userId];
            await existingMessage.edit({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'édition du message :', error);
        }
    } else {
        // Sinon, on envoie un nouveau message et on le stocke
        try {
            const progressChannel = await interaction.client.channels.fetch('1305603714165379204'); // Remplace avec l'ID du canal
            const newMessage = await progressChannel.send({ embeds: [embed] });
            // Stocke le message pour pouvoir l'éditer plus tard
            progressMessages[userData.userId] = newMessage;
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message :', error);
        }
    }
}

module.exports = { showProgress };
