import logging
from asgiref.sync import sync_to_async
from apps.accounts.models import User
from apps.common.utils import TelegramTokenManager

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', 
    level=logging.INFO
)
logger = logging.getLogger(__name__)

from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes


class TelegramBot:
    def __init__(self, token):
        self.token = token
        self.application = Application.builder().token(token).build()
        self.setup_handlers()
    
    def setup_handlers(self):
        """Handlerlarni sozlash"""
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        self.application.add_error_handler(self.error_handler)
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        /start komandasi
        Link orqali token kelgan bo‘lsa, User’ga telegram_chat_id ni biriktirish
        """
        try:
            chat_id = str(update.effective_chat.id)
            user_info = update.effective_user

            token = None
            if context.args:
                token = context.args[0]  # /start <token> bo‘lsa

            user_found = None
            if token:
                decoded_token = TelegramTokenManager.decode_token(token)
                user_found = await sync_to_async(User.objects.filter(id=decoded_token).first)()
                print(decoded_token, user_found)
                if user_found:
                    user_found.telegram_chat_id = chat_id
                    await sync_to_async(user_found.save)()
                    logger.info(f"User {user_found.full_name} registered via token and telegram_chat_id updated")
            else:
                # Eski logika: chat_id, username, ism-familiya bo‘yicha qidirish
                user_found = await self.find_and_update_user(chat_id, user_info)

            if user_found:
                await self.send_main_menu(update, context, user_found)
            else:
                await update.message.reply_text(
                    "❌ Sizning hisobingiz topilmadi.\n"
                    "Iltimos, avval web saytda ro'yxatdan o'ting yoki link orqali botga kiring.",
                    reply_markup=None
                )
        except Exception as e:
            logger.error(f"Start command error: {e}")
            await update.message.reply_text(
                "❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring."
            )
    
    async def find_and_update_user(self, chat_id, user_info):
        """
        Foydalanuvchini topish va telegram_chat_id ni yangilash
        """
        try:
            # 1. Avval telegram_chat_id bo'yicha qidirish
            user = await sync_to_async(User.objects.filter(telegram_chat_id=chat_id).first)()
            if user:
                logger.info(f"User found by chat_id: {user.full_name}")
                return user
            
            # 2. Username bo'yicha qidirish
            if user_info.username:
                user = await sync_to_async(User.objects.filter(username=user_info.username).first)()
                if user and not user.telegram_chat_id:
                    user.telegram_chat_id = chat_id
                    await sync_to_async(user.save)()
                    logger.info(f"User found by username and updated: {user.full_name}")
                    return user
            
            # 3. First name + last name bo'yicha qidirish
            if user_info.first_name and user_info.last_name:
                user = await sync_to_async(
                    User.objects.filter(
                        first_name__iexact=user_info.first_name,
                        last_name__iexact=user_info.last_name
                    ).first
                )()
                if user and not user.telegram_chat_id:
                    user.telegram_chat_id = chat_id
                    await sync_to_async(user.save)()
                    logger.info(f"User found by name and updated: {user.full_name}")
                    return user
            
            # 4. Agar hech narsa topilmasa
            logger.warning(f"No user found for chat_id: {chat_id}, username: {user_info.username}")
            return None
            
        except Exception as e:
            logger.error(f"Error finding user: {e}")
            return None
    
    async def send_main_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE, user):
        """
        Asosiy menyuni yuborish
        """
        # Keyboard tugmalarini yaratish
        keyboard = [
            [KeyboardButton("👤 Profilim")],
            [KeyboardButton("💳 To'lovlar")],
            [KeyboardButton("📋 Shartnomalar")],
            [KeyboardButton("ℹ️ Yordam")]
        ]
        
        reply_markup = ReplyKeyboardMarkup(
            keyboard, 
            resize_keyboard=True, 
            one_time_keyboard=False
        )
        
        welcome_text = f"🎉 Xush kelibsiz, {user.full_name}!\n\n" \
                      f"📋 Quyidagi bo'limlardan birini tanlang:"
        
        await update.message.reply_text(
            welcome_text,
            reply_markup=reply_markup
        )
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Tugma bosilganda ishlaydigan handler
        """
        try:
            message_text = update.message.text
            chat_id = str(update.effective_chat.id)
            
            # Foydalanuvchini topish
            user = await sync_to_async(User.objects.filter(telegram_chat_id=chat_id).first)()
            
            if not user:
                await update.message.reply_text(
                    "❌ Sizning hisobingiz topilmadi. Iltimos, /start bosing."
                )
                return
            
            # Tugmalarga javob berish
            if message_text == "👤 Profilim":
                await self.show_profile(update, context, user)
            
            elif message_text == "💳 To'lovlar":
                await self.show_payments(update, context, user)
            
            elif message_text == "📋 Shartnomalar":
                await self.show_contracts(update, context, user)
            
            elif message_text == "ℹ️ Yordam":
                await self.show_help(update, context)
            
            else:
                await update.message.reply_text(
                    "❓ Noma'lum buyruq. Iltimos, quyidagi tugmalardan birini tanlang.",
                    reply_markup=update.message.reply_markup
                )
                
        except Exception as e:
            logger.error(f"Handle message error: {e}")
            await update.message.reply_text("❌ Xatolik yuz berdi.")
    
    async def show_profile(self, update: Update, context: ContextTypes.DEFAULT_TYPE, user):
        """Profil ma'lumotlarini ko'rsatish"""
        try:
            profile_text = (
                f"""👤 *Sizning profilingiz:*
*F.I.O:* {user.full_name}
*Email:* {user.email}
*Telefon:* {user.phone_number or 'Kiritilmagan'}
*Rol:* {user.get_role_display()}
*Foydalanuvchi turi:* {user.get_user_type_display()}
*Ro'yxatdan o'tgan sana:* {user.date_joined.strftime('%d.%m.%Y %H:%M')}
*Holat:* {'✅ Faol' if user.is_active else '❌ Nofaol'}"""
            )

            await update.message.reply_text(profile_text, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Show profile error: {e}")
            await update.message.reply_text("❌ Profil ma'lumotlarini olishda xatolik.")
    
    async def show_payments(self, update: Update, context: ContextTypes.DEFAULT_TYPE, user):
        """To'lovlar ma'lumotlarini ko'rsatish"""
        try:
            # Bu yerda to'lovlar modelini import qilib ishlatishingiz mumkin
            payments_text = f"💳 *To'lovlar bo'limi:*\n\n" \
                           f"👤 *Foydalanuvchi:* {user.full_name}\n\n" \
                           f"📊 *To'lovlar statistikasi:*\n" \
                           f"• Jami to'lovlar: 0 so'm\n" \
                           f"• Oxirgi to'lov: Hali mavjud emas\n" \
                           f"• Qarzdorlik: 0 so'm\n" \
                           f"• Status: Faol\n\n" \
                           f"🌐 *Batafsil ma'lumot uchun web sahifangizga tashrif buyuring.*"
            
            await update.message.reply_text(payments_text, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Show payments error: {e}")
            await update.message.reply_text("❌ To'lovlar ma'lumotlarini olishda xatolik.")
    
    async def show_contracts(self, update: Update, context: ContextTypes.DEFAULT_TYPE, user):
        """Shartnomalar ma'lumotlarini ko'rsatish"""
        try:
            from apps.contracts.models import Contract
            # Statuslar bo'yicha countlarni olish
            total_count = await sync_to_async(Contract.objects.filter(user=user).count)()
            active_count = await sync_to_async(Contract.objects.filter(user=user, status='created').count)()
            completed_count = await sync_to_async(Contract.objects.filter(user=user, status='completed').count)()
            cancelled_count = await sync_to_async(Contract.objects.filter(user=user, status='cancelled').count)()
            pending_count = await sync_to_async(Contract.objects.filter(user=user, status='pending').count)()
            last_contract = await sync_to_async(Contract.objects.filter(user=user).order_by('-end_date').first)()
            last_updated = last_contract.end_date.strftime('%d.%m.%Y %H:%M') if last_contract else 'Mavjud emas'

            contracts_text = (
                f"📋 *Shartnomalar bo'limi:*\n\n"
                f"👤 *Foydalanuvchi:* {user.full_name}\n\n"
                f"📄 *Shartnomalar statistikasi:*\n"
                f"• Faol shartnomalar: {active_count} ta\n"
                f"• Tugagan shartnomalar: {completed_count} ta\n"
                f"• Bekor qilingan: {cancelled_count} ta\n"
                f"• Kutilayotgan: {pending_count} ta\n"
                f"• Jami shartnomalar: {total_count} ta\n"
                f"• Oxirgi yangilangan: {last_updated}\n\n"
                f"🌐 *Batafsil ma'lumot uchun web sahifangizga tashrif buyuring.*"
            )
            await update.message.reply_text(contracts_text, parse_mode='Markdown')
        except Exception as e:
            logger.error(f"Show contracts error: {e}")
            await update.message.reply_text("❌ Shartnomalar ma'lumotlarini olishda xatolik.")
    
    async def show_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Yordam bo'limi"""
        help_text = f"ℹ️ *Yordam bo'limi:*\n\n" \
                   f"*Mavjud buyruqlar:*\n" \
                   f"• /start - Botni qayta ishga tushirish\n\n" \
                   f"*Tugmalar:*\n" \
                   f"• 👤 Profilim - Shaxsiy ma'lumotlar\n" \
                   f"• 💳 To'lovlar - To'lov tarixi\n" \
                   f"• 📋 Shartnomalar - Shartnoma ma'lumotlari\n" \
                   f"• ℹ️ Yordam - Bu bo'lim\n\n" \
                   f"❓ *Savol yoki muammo bo'lsa:*\n" \
                   f"📞 Qo'llab-quvvatlash xizmati bilan bog'laning"
        
        await update.message.reply_text(help_text, parse_mode='Markdown')
    
    async def error_handler(self, update: object, context: ContextTypes.DEFAULT_TYPE):
        """Global error handler"""
        logger.error(f"Exception while handling an update: {context.error}")
        
        if update and hasattr(update, 'effective_message'):
            await update.effective_message.reply_text(
                "❌ Botda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring."
            )
    
    def run(self):
        """Botni ishga tushirish"""
        logger.info("🤖 Telegram Bot ishga tushdi!")
        self.application.run_polling()