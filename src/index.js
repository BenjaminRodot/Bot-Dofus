const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

const successChannelID = '1306076291551858769';
const userAchievementsFilePath = path.join(__dirname, 'data/user_achievements.json');

// Configuration et initialisation du client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers
	]
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Charger les succès enregistrés et leurs messages
const loadUserAchievements = () => {
    try {
        const data = fs.readFileSync(userAchievementsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

// Sauvegarder les succès des utilisateurs
const saveUserAchievements = (achievements) => { 
    fs.writeFileSync(userAchievementsFilePath, JSON.stringify(achievements, null, 2));
};

// Reaction Succés
client.on('raw', async (packet) => {
    // Vérifie si l'événement concerne une réaction ajoutée ou supprimée
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;

    // Vérifie si le canal correspond au canal autorisé
    const channel = await client.channels.fetch(packet.d.channel_id);
    if (!channel || channel.id !== successChannelID) return;

    try {
        // Récupère le message depuis Discord (et force le rechargement si déjà en cache)
        const message = await channel.messages.fetch(packet.d.message_id, { cache: true });

        // Met le message dans le cache
        channel.messages.cache.set(message.id, message);

        // Revalide les réactions pour le message
        await message.fetch(true);

        const userId = packet.d.user_id;
        const user = await client.users.fetch(userId);

        // Construit l'emoji à partir des données du paquet
        const emoji = packet.d.emoji.id
            ? `${packet.d.emoji.name}:${packet.d.emoji.id}`
            : packet.d.emoji.name;

        // Obtient la réaction à partir du message
        const reaction = message.reactions.cache.get(emoji);

        // Émet l'événement correspondant
        const userAchievements = loadUserAchievements();
        const name = message.embeds[0]?.title; // Vérifie si l'embed existe
        const description = message.embeds[0]?.description;

        if (!name || !description) {
            console.warn('Le message ne contient pas d’embed valide pour traiter les succès.');
            return;
        }

        if (packet.t === 'MESSAGE_REACTION_ADD') {
            console.log("add");
            if (!userAchievements[user.id]) {
                userAchievements[user.id] = [];
            }
            if (!userAchievements[user.id].find(ach => ach.name === name)) {
                userAchievements[user.id].push({ name, description, emoji });
                saveUserAchievements(userAchievements);
                console.log(`Succès "${name}" ajouté pour l'utilisateur ${user.username}.`);
            }
        } else if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            console.log("remove");
            if (userAchievements[user.id]) {
                userAchievements[user.id] = userAchievements[user.id].filter(ach => ach.name !== name);
                saveUserAchievements(userAchievements);
                console.log(`Succès "${name}" retiré pour l'utilisateur ${user.username}.`);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du message ou du traitement des réactions :', error);
    }
});

client.login(token);