require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    console.log(`📊 Activo en ${client.guilds.cache.size} servidores`);
    client.user.setActivity('!ayuda para comandos', { type: 'WATCHING' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.content === '!ayuda') {
        message.reply({
            embeds: [{
                color: 0x0099ff,
                title: '📋 Comandos Disponibles',
                description: 'Lista de comandos del bot',
                fields: [
                    { name: '!ayuda', value: 'Muestra este mensaje' },
                    { name: '!ping', value: 'Verifica la latencia del bot' },
                    { name: '!hola', value: 'Saluda al bot' },
                    { name: '!servidor', value: 'Información del servidor' },
                ],
                timestamp: new Date(),
            }]
        });
    }
    
    if (message.content === '!ping') {
        const latencia = Date.now() - message.createdTimestamp;
        message.reply(`🏓 Pong! Latencia: ${latencia}ms | API: ${Math.round(client.ws.ping)}ms`);
    }
    
    if (message.content === '!hola') {
        message.reply(`¡Hola ${message.author.username}! 👋`);
    }
    
    if (message.content === '!servidor') {
        const guild = message.guild;
        message.reply({
            embeds: [{
                color: 0x00ff00,
                title: `📊 Información de ${guild.name}`,
                thumbnail: { url: guild.iconURL() },
                fields: [
                    { name: 'Miembros', value: `${guild.memberCount}`, inline: true },
                    { name: 'Creado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                ],
            }]
        });
    }
});

client.on('error', (error) => {
    console.error('❌ Error del cliente:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Error no manejado:', error);
});

client.login(TOKEN).catch(err => {
    console.error('❌ Error al iniciar sesión:', err);
    process.exit(1);
});