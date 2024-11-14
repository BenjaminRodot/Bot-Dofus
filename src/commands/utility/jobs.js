const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const buttonWrapper = require('../../button-wrapper');
const { saveUserData } = require('../../utils/saveData.js');
const { showAllProgress } = require('../../utils/showAllProgress'); 


module.exports = {
	data: new SlashCommandBuilder()
		.setName('jobs')
		.setDescription('Choisis ton métier'),

	async execute(interaction) {
		const buttonsJobs = [
			{ id: 'recolte', label: 'Recolte' },
			{ id: 'craft', label: 'Craft' },
			{ id: 'forgemagie', label: 'Forgemagie' },
		].map(({ id, label }) =>
			new ButtonBuilder()
				.setCustomId(id)
				.setLabel(label)
				.setStyle(ButtonStyle.Primary)
		);

		const buttonsRecolte = [
			{ id: 'alchimiste', label: 'Alchimiste' },
			{ id: 'bucheron', label: 'Bucheron' },
			{ id: 'paysan', label: 'Paysan' },
			{ id: 'mineur', label: 'Mineur' },
			{ id: 'pecheur', label: 'Pecheur' },
			{ id: 'chasseur', label: 'Chasseur' }
		].map(({ id, label }) =>
			new ButtonBuilder()
				.setCustomId(id)
				.setLabel(label)
				.setStyle(ButtonStyle.Primary)
		);

		const buttonsCraft = [
			{ id: 'bricoleur', label: 'Bricoleur' },
			{ id: 'bijoutier', label: 'Bijoutier' },
			{ id: 'cordonnier', label: 'Cordonnier' },
			{ id: 'faconneur', label: 'Faconneur' },
			{ id: 'forgeron', label: 'Forgeron' },
			{ id: 'sculpteur', label: 'Sculpteur' },
			{ id: 'tailleur', label: 'Tailleur' }
		].map(({ id, label }) =>
			new ButtonBuilder()
				.setCustomId(id)
				.setLabel(label)
				.setStyle(ButtonStyle.Primary)
		);

		const buttonsForgemagie = [
			{ id: 'joaillomage', label: 'Joaillomage ' },
			{ id: 'cordomage', label: 'Cordomage ' },
			{ id: 'facomage', label: 'Facomage ' },
			{ id: 'forgemage', label: 'Forgemage ' },
			{ id: 'sculptemage', label: 'Sculptemage ' },
			{ id: 'costumage', label: 'Costumage ' }
		].map(({ id, label }) =>
			new ButtonBuilder()
				.setCustomId(id)
				.setLabel(label)
				.setStyle(ButtonStyle.Primary)
		);

		// Envoie le message initial avec les boutons
		const response = await interaction.reply({
			content: 'Quel type de metier as-tu farme ?',
			components: buttonWrapper(buttonsJobs),
		});

		const collectorFilter = i => i.user.id === interaction.user.id;

		try {
			// Attend la réponse de l'utilisateur
			const confirmationJobType = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
			await confirmationJobType.deferUpdate();
			const selectedJobType = confirmationJobType.customId;

			let buttonsSelectedJobs = [];

			if (selectedJobType === "recolte") {
				buttonsSelectedJobs = buttonsRecolte;
			} else if (selectedJobType === "craft") {
				buttonsSelectedJobs = buttonsCraft;
			} else if (selectedJobType === "forgemagie") {
				buttonsSelectedJobs = buttonsForgemagie;
			}

			// Édite le message selon le métier choisi
			await interaction.editReply({
				content: `Quel metier precisement ?`,
				components: buttonWrapper(buttonsSelectedJobs),
			});

			const confirmationJob = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
			await confirmationJob.deferUpdate();
			const selectedJob = confirmationJob.customId;

			await interaction.editReply({
				content: `Quel est ton niveau ?`,
				components: [],
				fetchReply: true,
			});

			const messageFilter = msg => msg.author.id === interaction.user.id && !isNaN(msg.content);
			const collectedMessages = await interaction.channel.awaitMessages({
				filter: messageFilter,
				max: 1,
				time: 60_000,
				errors: ['time'],
			});

			const levelResponse = collectedMessages.first();
			collectedMessages.first().delete();
			interaction.deleteReply();

			// Sauvegarde les informations dans un fichier JSON
			const userData = {
				userId: interaction.user.id,
				username: interaction.user.username,
				job: confirmationJob.customId,
				level: levelResponse.content
			};

			saveUserData(userData);
			await showAllProgress(interaction);

			interaction.followUp(`Merci ${interaction.user.username} ! Ton niveau de ${selectedJob} est ${levelResponse.content}.`);

		} catch (e) {
			console.log(e);
			await interaction.editReply({
				content: 'Aucune reponse recue dans le delai imparti, operation annulee.',
				components: []
			});
		}
	},
};