const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

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

// Charger les messages enregistr�s
const loadSuccessMessages = () => {
    console.log("succe load");
    try {
        const data = fs.readFileSync('data/success_messages.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};  // Si le fichier n'existe pas, renvoie un objet vide
    }
};

// Charger les succ�s enregistr�s et leurs messages
const loadUserAchievements = () => {
    try {
        const data = fs.readFileSync('data/user_achievements.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

// Sauvegarder les succ�s des utilisateurs
const saveUserAchievements = (userId, achievements) => {
    const data = loadUserAchievements();
    data[userId] = achievements;
    fs.writeFileSync('data/user_achievements.json', JSON.stringify(data, null, 2));
};

// Fonction pour g�rer l'ajout ou la suppression des r�actions
const handleReaction = (reaction, user, add) => {
    const userId = user.id;
    const successName = reaction.message.embeds[0].title; // Nom du succ�s � partir du titre du message

    let userAchievements = loadUserAchievements();

    if (add) {
        // Ajouter le succ�s � l'utilisateur
        if (!userAchievements[userId]) {
            userAchievements[userId] = [];
        }
        userAchievements[userId].push(successName);
    } else {
        // Retirer le succ�s de l'utilisateur
        userAchievements[userId] = userAchievements[userId].filter(ach => ach !== successName);
    }

    // Sauvegarder les donn�es des utilisateurs
    saveUserAchievements(userId, userAchievements[userId]);
};

// R�agir aux �v�nements de r�action
client.on('messageReactionAdd', (reaction, user) => {
    if (user.bot) return;  // Ignorer les r�actions des bots

    // V�rifiez si ce message fait partie des messages de succ�s
    const successMessages = loadSuccessMessages();
    for (const successName in successMessages) {
        if (reaction.message.id === successMessages[successName]) {
            handleReaction(reaction, user, true);
            break;
        }
    }
});

client.on('messageReactionRemove', (reaction, user) => {
    if (user.bot) return;  // Ignorer les r�actions des bots

    // V�rifiez si ce message fait partie des messages de succ�s
    const successMessages = loadSuccessMessages();
    for (const successName in successMessages) {
        if (reaction.message.id === successMessages[successName]) {
            handleReaction(reaction, user, false);
            break;
        }
    }
});

client.login(token);