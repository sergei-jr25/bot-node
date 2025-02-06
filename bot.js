const { TelegramClient } = require('telegram')
const { StringSession } = require('telegram/sessions')
const readline = require('readline')
const { NewMessage } = require('telegram/events')
const { Api } = require('telegram/tl')

const fs = require('fs')
const dotenv = require('dotenv')

dotenv.config()

const apiId = Number(process.env.API_KENDY)
const apiHash = process.env.APPI_HASH_KENDY

const sessionFilePath = 'ssesinon-keyndy.txt'
const sessionString = fs.existsSync(sessionFilePath)
	? fs.readFileSync(sessionFilePath, 'utf8')
	: ''

let stringSession = new StringSession(sessionString)
const channels = ['channel_1r', 'channel_2r', 'Channel_1 Chat']

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

console.log('Loading interactive example...')
const client = new TelegramClient(stringSession, apiId, apiHash, {
	connectionRetries: 5,
})

async function startBot() {
	await client.start({
		phoneNumber: async () =>
			new Promise(resolve =>
				rl.question('Please enter your number: ', resolve)
			),
		password: async () =>
			new Promise(resolve =>
				rl.question('Please enter your password: ', resolve)
			),
		phoneCode: async () =>
			new Promise(resolve =>
				rl.question('Please enter the code you received: ', resolve)
			),
		onError: err => console.log(err),
	})

	console.log('✅ Бот запущен!')
	console.log('Сохраните эту строку сессии в .env:')
	console.log(client.session.save())
	const messageText = 'Привет! Это тестовая рассылка 😊'
	const delayBetweenMessages = 3000 // ⏳ Задержка между отправками (в миллисекундах)
	// await checkAllComments('Channel_1 Chat', client)

	// Прослушивание сообщений
	client.addEventHandler(handleNewMessage, new NewMessage({}))

	// await sendBulkMessages(client, channels[0],messageText)

	// await parseUsers(channels[0])

	// await sendUsersMessage(delayBetweenMessages, messageText)
}
async function isAdmin(channelId, userId) {
	try {
		const participants = await client.invoke(
			new Api.channels.GetParticipants({
				channel: channelId,
				filter: new Api.ChannelParticipantsAdmins(),
				offset: 0,
				limit: 100,
			})
		)

		// Проверяем, есть ли userId в списке админов
		const isUserAdmin = participants.participants.some(participant => {
			console.log(participant.userId, 'participant')
			console.log(participant.userId, 'userId')
			console.log(participant.userId === userId, 'IsuserId')

			return participant.userId.value === userId.value
		})
		console.log(isUserAdmin, 'isUserAdmin')

		return isUserAdmin
	} catch (error) {
		console.error('Ошибка при проверке админов:', error)
		return false
	}
}
async function handleNewMessage(event) {
	try {
		const message = event.message
		const chatId = message.chatId
		const chat = await client.getEntity(chatId)
		const { id } = await client.getEntity(message.senderId)

		const chatTitle = chat.title
		const chatUsername = message.chat.username

		const admin = await isAdmin(chatId, id)
		console.log(admin, 'admin')

		console.log(chatUsername, 'chatUsername')

		// const user = await client.getEntity(message.senderId)
		// console.log(user, 'user-info')

		// Проверяем, есть ли канал в списке
		if (!channels.includes(chatTitle)) return

		// Проверяем, что сообщение пришло из комментариев канала
		if (!message.chatId || !message.isChannel) return
		const sender = await message.getSender()
		console.log('sernder', sender?.id)

		if (!sender || sender.bot) return

		const { fullUser } = await client.invoke(
			new Api.users.GetFullUser({ id: sender.id })
		)

		console.log(`📩 Новый комментарий от @${sender.username || sender.id}`)

		// Получаем полную информацию о пользователе
		// Integer { value: 2260263425n } userFull.personalChannelId
		if (
			(fullUser && fullUser?.about?.split(':').includes('https')) ||
			fullUser?.personalChannelId
		) {
			console.log(
				`⚠️ Пользователь @${sender.username} содержит ссылку в bio! Удаляем комментарий...`
			)

			// Удаляем комментарий
			// await client.invoke(
			// 	new Api.messages.DeleteMessages({
			// 		chatId: chatId, // Используем ID канала
			// 		id: [chatUsername], // Удаляем конкретное сообщение
			// 	})
			// )
			// await client.invoke(
			// 	new Api.messages.DeleteMessages({
			// 		chatId: chatId,
			// 		id: [message.id],
			// 	})
			// )
			await client.deleteMessages(chatId, [message.id], { revoke: true })

			// await client.deleteMessages(message.chatId, [message.id])

			console.log(`✅ Комментарий удалён в ${chatId}, от ${message.id}`)

			// (Опционально) Блокируем пользователя
			// await client.invoke(
			// 	new Api.channels.EditBanned({
			// 		channel: message.chatId,
			// 		participant: sender.id,
			// 		bannedRights: new Api.ChatBannedRights({
			// 			untilDate: 0, // навсегда
			// 			sendMessages: true, // запрет на отправку сообщений
			// 		}),
			// 	})
			// )
			console.log(`🚫 Пользователь @${sender.username} заблокирован.`)
		}
	} catch (error) {
		console.error('❌ Ошибка:', error)
	}
}
startBot()

// +27740906938
// +27740906938
// +27 74 090 6938
// +7 951 521 5669
// node bot-2.js
