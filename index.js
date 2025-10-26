require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;

// Sistema de warnings
const warnings = new Map();

// Sistema anti-spam
const messageCache = new Map();
const SPAM_THRESHOLD = 5; // mensajes
const SPAM_TIME = 5000; // 5 segundos

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    console.log(`📊 Activo en ${client.guilds.cache.size} servidores`);
    client.user.setActivity('!ayuda para comandos', { type: 'WATCHING' });
});

// Anti-spam automático
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Verificar spam
    const userId = message.author.id;
    const now = Date.now();

    if (!messageCache.has(userId)) {
        messageCache.set(userId, []);
    }

    const userMessages = messageCache.get(userId);
    userMessages.push(now);

    // Limpiar mensajes antiguos
    const recentMessages = userMessages.filter(timestamp => now - timestamp < SPAM_TIME);
    messageCache.set(userId, recentMessages);

    // Detectar spam
    if (recentMessages.length >= SPAM_THRESHOLD) {
        if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        try {
            await message.member.timeout(60000, 'Spam detectado'); // 1 minuto
            message.channel.send(`⚠️ ${message.author} fue silenciado por 1 minuto por spam!`);
            messageCache.delete(userId);
        } catch (error) {
            console.error('Error al aplicar timeout:', error);
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ========== COMANDOS BÁSICOS ==========

    if (command === 'ayuda') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Comandos de Perrote BOT')
            .setDescription('Bot de moderación y utilidades')
            .addFields(
                { name: '📌 Básicos', value: '`!ping`, `!hola`, `!servidor`' },
                { name: '🛡️ Moderación', value: '`!ban`, `!kick`, `!mute`, `!unmute`, `!warn`, `!warnings`' },
                { name: '🧹 Limpieza', value: '`!clear [cantidad]`' },
                { name: '🔒 Canales', value: '`!lock`, `!unlock`' }
            )
            .setFooter({ text: 'Perrote BOT - Moderación' });
        
        return message.reply({ embeds: [embed] });
    }

    if (command === 'ping') {
        const latencia = Date.now() - message.createdTimestamp;
        message.reply(`🏓 Pong! Latencia: ${latencia}ms | API: ${Math.round(client.ws.ping)}ms`);
    }

    if (command === 'hola') {
        message.reply(`¡Hola ${message.author.username}! 👋`);
    }

    if (command === 'servidor') {
        const guild = message.guild;
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`📊 Información de ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: 'Miembros', value: `${guild.memberCount}`, inline: true },
                { name: 'Creado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
            );
        
        message.reply({ embeds: [embed] });
    }

    // ========== COMANDOS DE MODERACIÓN ==========

    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ No tienes permisos para banear miembros!');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Debes mencionar a un usuario! Uso: `!ban @usuario [razón]`');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Usuario no encontrado en el servidor!');
        }

        if (!member.bannable) {
            return message.reply('❌ No puedo banear a este usuario!');
        }

        const reason = args.slice(1).join(' ') || 'No se especificó razón';

        try {
            await member.ban({ reason });
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 Usuario Baneado')
                .addFields(
                    { name: 'Usuario', value: `${user.tag}`, inline: true },
                    { name: 'Moderador', value: `${message.author.tag}`, inline: true },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply('❌ Hubo un error al banear al usuario!');
        }
    }

    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ No tienes permisos para expulsar miembros!');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Debes mencionar a un usuario! Uso: `!kick @usuario [razón]`');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Usuario no encontrado en el servidor!');
        }

        if (!member.kickable) {
            return message.reply('❌ No puedo expulsar a este usuario!');
        }

        const reason = args.slice(1).join(' ') || 'No se especificó razón';

        try {
            await member.kick(reason);
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('👢 Usuario Expulsado')
                .addFields(
                    { name: 'Usuario', value: `${user.tag}`, inline: true },
                    { name: 'Moderador', value: `${message.author.tag}`, inline: true },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply('❌ Hubo un error al expulsar al usuario!');
        }
    }

    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ No tienes permisos para silenciar miembros!');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Debes mencionar a un usuario! Uso: `!mute @usuario [tiempo en minutos] [razón]`');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Usuario no encontrado en el servidor!');
        }

        const time = parseInt(args[1]) || 10; // minutos, default 10
        const reason = args.slice(2).join(' ') || 'No se especificó razón';

        try {
            await member.timeout(time * 60 * 1000, reason);
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('🔇 Usuario Silenciado')
                .addFields(
                    { name: 'Usuario', value: `${user.tag}`, inline: true },
                    { name: 'Duración', value: `${time} minutos`, inline: true },
                    { name: 'Moderador', value: `${message.author.tag}`, inline: true },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply('❌ Hubo un error al silenciar al usuario!');
        }
    }

    if (command === 'unmute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ No tienes permisos para quitar silencios!');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Debes mencionar a un usuario! Uso: `!unmute @usuario`');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Usuario no encontrado en el servidor!');
        }

        try {
            await member.timeout(null);
            message.reply(`✅ ${user.tag} ya puede hablar de nuevo!`);
        } catch (error) {
            console.error(error);
            message.reply('❌ Hubo un error al quitar el silencio!');
        }
    }

    if (command === 'warn') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ No tienes permisos para advertir miembros!');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Debes mencionar a un usuario! Uso: `!warn @usuario [razón]`');
        }

        const reason = args.slice(1).join(' ') || 'No se especificó razón';
        const userId = user.id;
        const guildId = message.guild.id;
        const key = `${guildId}-${userId}`;

        if (!warnings.has(key)) {
            warnings.set(key, []);
        }

        const userWarnings = warnings.get(key);
        userWarnings.push({
            moderator: message.author.tag,
            reason,
            date: new Date()
        });

        const warnCount = userWarnings.length;

        const embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('⚠️ Usuario Advertido')
            .addFields(
                { name: 'Usuario', value: `${user.tag}`, inline: true },
                { name: 'Advertencias', value: `${warnCount}/3`, inline: true },
                { name: 'Moderador', value: `${message.author.tag}`, inline: true },
                { name: 'Razón', value: reason }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });

        // Auto-ban a las 3 advertencias
        if (warnCount >= 3) {
            const member = message.guild.members.cache.get(userId);
            if (member && member.bannable) {
                try {
                    await member.ban({ reason: '3 advertencias acumuladas' });
                    message.channel.send(`🔨 ${user.tag} fue baneado automáticamente por acumular 3 advertencias!`);
                    warnings.delete(key);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }

    if (command === 'warnings') {
        const user = message.mentions.users.first() || message.author;
        const userId = user.id;
        const guildId = message.guild.id;
        const key = `${guildId}-${userId}`;

        const userWarnings = warnings.get(key) || [];

        if (userWarnings.length === 0) {
            return message.reply(`✅ ${user.tag} no tiene advertencias!`);
        }

        let warningList = '';
        userWarnings.forEach((warn, index) => {
            warningList += `**${index + 1}.** ${warn.reason}\n   ↳ Por: ${warn.moderator}\n   ↳ Fecha: ${warn.date.toLocaleDateString()}\n\n`;
        });

        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle(`⚠️ Advertencias de ${user.tag}`)
            .setDescription(warningList)
            .setFooter({ text: `Total: ${userWarnings.length} advertencia(s)` });

        message.reply({ embeds: [embed] });
    }

    if (command === 'clear') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ No tienes permisos para borrar mensajes!');
        }

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('❌ Debes especificar un número entre 1 y 100! Uso: `!clear [cantidad]`');
        }

        try {
            await message.channel.bulkDelete(amount + 1, true);
            const reply = await message.channel.send(`✅ Se borraron ${amount} mensajes!`);
            setTimeout(() => reply.delete(), 3000);
        } catch (error) {
            console.error(error);
            message.reply('❌ Hubo un error al borrar los mensajes!');
        }
    }

    if (command === 'lock') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ No tienes permisos para bloquear canales!');
        }

        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: false
            });
            message.reply('🔒 Canal bloqueado! Solo los moderadores pueden escribir.');
        } catch (error) {
            console.error(error);
            message.reply('❌ Hubo un error al bloquear el canal!');
        }
    }

    if (command === 'unlock') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ No tienes permisos para desbloquear canales!');
        }

        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: null
            });
            message.reply('🔓 Canal desbloqueado! Todos pueden escribir de nuevo.');
        } catch (error) {
            console.error(error);
            message.reply('❌ Hubo un error al desbloquear el canal!');
        }
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