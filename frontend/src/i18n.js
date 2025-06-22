import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'Login': 'Login',
      'Register': 'Register',
      'SignIn': 'Sign In',
      'Sign Up': 'Sign Up',
      'Sign up': 'Sign Up',
      'SignIn': 'Sign In',
      'DontHaveAnAccount': "Don't have an account? Sign Up",
      'Username': 'Username',
      'Password': 'Password',
      'Email Address': 'Email Address',
      'Logout': 'Logout',
      'Chats': 'Chats',
      'Settings': 'Settings',
      'Send': 'Send',
      'Search': 'Search',
      'Dark Mode': 'Dark Mode',
      'Light Mode': 'Light Mode',
      'New Chat': 'New Chat',
      'Direct Message': 'Direct Message',
      'Start a private conversation': 'Start a private conversation',
      'Group Chat': 'Group Chat',
      'Create a group conversation': 'Create a group conversation',
      'No chats yet. Start a new conversation!': 'No chats yet. Start a new conversation!',
      'Select a chat': 'Select a chat',
      'No messages yet. Start the conversation!': 'No messages yet. Start the conversation!',
      'Type a message...': 'Type a message...',
      'Select a chat to start messaging': 'Select a chat to start messaging',
      'Choose an existing conversation or start a new one': 'Choose an existing conversation or start a new one',
      'Create New Chat': 'Create New Chat',
      'Chat Name': 'Chat Name',
      'Private Chat': 'Private Chat',
      'Cancel': 'Cancel',
      'Create': 'Create',
      'Delete Chat': 'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.': 'Are you sure you want to delete this chat? This action cannot be undone.',
      'Delete': 'Delete',
      'No chat selected for deletion': 'No chat selected for deletion',
      'Profile Settings': 'Profile Settings',
      'Update your profile information': 'Update your profile information',
      'Toggle dark/light theme': 'Toggle dark/light theme',
      'Notifications': 'Notifications',
      'Enable/disable notifications': 'Enable/disable notifications',
      'Logged in as': 'Logged in as',
      'Save Changes': 'Save Changes',
    }
  },
  ru: {
    translation: {
      'Login': 'Войти',
      'Register': 'Регистрация',
      'SignIn': 'Войти',
      'Sign Up': 'Зарегистрироваться',
      'Sign up': 'Зарегистрироваться',
      'DontHaveAnAccount': 'Нет аккаунта? Зарегистрируйтесь',
      'Username': 'Имя пользователя',
      'Password': 'Пароль',
      'Email Address': 'Электронная почта',
      'Logout': 'Выйти',
      'Chats': 'Чаты',
      'Settings': 'Настройки',
      'Send': 'Отправить',
      'Search': 'Поиск',
      'Dark Mode': 'Тёмная тема',
      'Light Mode': 'Светлая тема',
      'New Chat': 'Новый чат',
      'Direct Message': 'Личное сообщение',
      'Start a private conversation': 'Начать личную переписку',
      'Group Chat': 'Групповой чат',
      'Create a group conversation': 'Создать групповой чат',
      'No chats yet. Start a new conversation!': 'Пока нет чатов. Начните новый разговор!',
      'Select a chat': 'Выберите чат',
      'No messages yet. Start the conversation!': 'Пока нет сообщений. Начните переписку!',
      'Type a message...': 'Введите сообщение...',
      'Select a chat to start messaging': 'Выберите чат для переписки',
      'Choose an existing conversation or start a new one': 'Выберите существующий чат или начните новый',
      'Create New Chat': 'Создать новый чат',
      'Chat Name': 'Название чата',
      'Private Chat': 'Личный чат',
      'Cancel': 'Отмена',
      'Create': 'Создать',
      'Delete Chat': 'Удалить чат',
      'Are you sure you want to delete this chat? This action cannot be undone.': 'Вы уверены, что хотите удалить этот чат? Это действие необратимо.',
      'Delete': 'Удалить',
      'No chat selected for deletion': 'Чат для удаления не выбран',
      'Profile Settings': 'Настройки профиля',
      'Update your profile information': 'Обновите информацию профиля',
      'Toggle dark/light theme': 'Переключить тёмную/светлую тему',
      'Notifications': 'Уведомления',
      'Enable/disable notifications': 'Включить/отключить уведомления',
      'Logged in as': 'Вы вошли как',
      'Save Changes': 'Сохранить изменения',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 