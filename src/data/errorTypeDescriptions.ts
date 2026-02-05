 /**
  * Справочник типов ошибок с описаниями, влиянием и рекомендациями
  */
 
 export interface ErrorTypeInfo {
   type: string;
   title: string;
   description: string;
   impact: string;
   recommendation: string;
   severity: 'low' | 'medium' | 'high' | 'critical';
 }
 
 export const errorTypeDescriptions: Record<string, ErrorTypeInfo> = {
   'Auth Data Load Failed': {
     type: 'Auth Data Load Failed',
     title: 'Ошибка загрузки данных авторизации',
     description: 'Не удалось загрузить профиль или роли пользователя после входа в систему.',
     impact: 'Пользователь может не увидеть свои данные или не получить доступ к функциям системы.',
     recommendation: 'Обычно связано с отсутствием профиля для нового пользователя. Проверьте наличие записи в таблице profiles.',
     severity: 'medium',
   },
   'Profile Load Error': {
     type: 'Profile Load Error',
     title: 'Ошибка загрузки профиля',
     description: 'Не удалось загрузить данные профиля пользователя из базы данных.',
     impact: 'Пользователь не сможет видеть свой профиль и связанные данные (организацию, должность).',
     recommendation: 'Проверьте RLS-политики таблицы profiles и наличие записи для данного user_id.',
     severity: 'high',
   },
   'React Error': {
     type: 'React Error',
     title: 'Ошибка React компонента',
     description: 'Произошла ошибка при рендеринге React компонента.',
     impact: 'Часть интерфейса может не отображаться или работать некорректно.',
     recommendation: 'Проверьте stack trace для определения проблемного компонента. Часто связано с undefined данными.',
     severity: 'high',
   },
   'Uncaught Error': {
     type: 'Uncaught Error',
     title: 'Необработанная ошибка',
     description: 'Произошла JavaScript ошибка, которая не была перехвачена обработчиками.',
     impact: 'Может привести к некорректной работе приложения или потере данных.',
     recommendation: 'Добавьте обработку ошибок (try/catch) в указанном месте кода.',
     severity: 'high',
   },
   'Unhandled Promise Rejection': {
     type: 'Unhandled Promise Rejection',
     title: 'Необработанное отклонение Promise',
     description: 'Асинхронная операция завершилась с ошибкой, которая не была обработана.',
     impact: 'Асинхронная операция (загрузка данных, API-запрос) не выполнена.',
     recommendation: 'Добавьте .catch() или try/catch для обработки ошибок в асинхронных операциях.',
     severity: 'medium',
   },
   'API Error': {
     type: 'API Error',
     title: 'Ошибка API запроса',
     description: 'Запрос к серверу или внешнему API завершился с ошибкой.',
     impact: 'Данные не были получены или отправлены. Функционал может быть недоступен.',
     recommendation: 'Проверьте доступность сервера, корректность URL и параметров запроса.',
     severity: 'medium',
   },
   'Network Error': {
     type: 'Network Error',
     title: 'Сетевая ошибка',
     description: 'Проблема с сетевым подключением при выполнении запроса.',
     impact: 'Невозможно загрузить или отправить данные.',
     recommendation: 'Временная проблема. Проверьте интернет-соединение пользователя.',
     severity: 'low',
   },
   'Load failed': {
     type: 'Load failed',
     title: 'Ошибка загрузки ресурса',
     description: 'Не удалось загрузить файл, скрипт или другой ресурс.',
     impact: 'Часть функционала или стилей может быть недоступна.',
     recommendation: 'Временная сетевая проблема. Обычно решается перезагрузкой страницы.',
     severity: 'low',
   },
   'Supabase Error': {
     type: 'Supabase Error',
     title: 'Ошибка Supabase',
     description: 'Ошибка при взаимодействии с базой данных Supabase.',
     impact: 'Операция с базой данных не выполнена.',
     recommendation: 'Проверьте RLS-политики, структуру таблицы и корректность запроса.',
     severity: 'high',
   },
   'Validation Error': {
     type: 'Validation Error',
     title: 'Ошибка валидации',
     description: 'Данные не прошли проверку на корректность.',
     impact: 'Пользователь не может сохранить данные до исправления ошибок.',
     recommendation: 'Проверьте форму валидации и требования к данным.',
     severity: 'low',
   },
   'Permission Denied': {
     type: 'Permission Denied',
     title: 'Доступ запрещён',
     description: 'У пользователя нет прав для выполнения данной операции.',
     impact: 'Операция не выполнена из-за ограничений доступа.',
     recommendation: 'Проверьте роли пользователя и RLS-политики.',
     severity: 'medium',
   },
   'Session Expired': {
     type: 'Session Expired',
     title: 'Сессия истекла',
     description: 'Сессия авторизации пользователя истекла.',
     impact: 'Пользователь будет перенаправлен на страницу входа.',
     recommendation: 'Нормальное поведение. Пользователю нужно войти заново.',
     severity: 'low',
   },
 };
 
 /**
  * Получить информацию о типе ошибки
  */
 export function getErrorTypeInfo(errorType: string): ErrorTypeInfo | null {
   // Точное совпадение
   if (errorTypeDescriptions[errorType]) {
     return errorTypeDescriptions[errorType];
   }
   
   // Частичное совпадение
   for (const [key, info] of Object.entries(errorTypeDescriptions)) {
     if (errorType.toLowerCase().includes(key.toLowerCase())) {
       return info;
     }
   }
   
   return null;
 }
 
 /**
  * Получить цвет для уровня серьёзности
  */
 export function getSeverityColor(severity: string): string {
   switch (severity) {
     case 'critical':
       return 'text-red-600 dark:text-red-400';
     case 'high':
       return 'text-orange-600 dark:text-orange-400';
     case 'medium':
       return 'text-yellow-600 dark:text-yellow-400';
     case 'low':
       return 'text-blue-600 dark:text-blue-400';
     default:
       return 'text-muted-foreground';
   }
 }