// frontend/src/utils/debug.ts
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enabled: boolean;
  prefix: string;
  color: string;
}

const LOG_CONFIGS: Record<LogLevel, LogConfig> = {
  debug: { level: 'debug', enabled: false, prefix: '[DEBUG FRONTEND]', color: '#6b7280' }, // ✅ Désactivé en dev
  info: { level: 'info', enabled: IS_DEVELOPMENT, prefix: '[INFO FRONTEND]', color: '#3b82f6' },
  warn: { level: 'warn', enabled: IS_DEVELOPMENT, prefix: '[WARN FRONTEND]', color: '#f59e0b' },
  error: { level: 'error', enabled: true, prefix: '[ERROR FRONTEND]', color: '#ef4444' }
};

/**
 * Système de logging amélioré avec niveaux de log
 */
const createLogger = (level: LogLevel) => {
  const config = LOG_CONFIGS[level];
  
  return (message: string, data?: any) => {
    if (!config.enabled) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const styledMessage = `%c${config.prefix} ${timestamp} - ${message}`;
    
    const consoleFn = level === 'error' ? console.error : 
                     level === 'warn' ? console.warn :
                     level === 'info' ? console.info : console.log;
    
    if (data !== undefined) {
      consoleFn(styledMessage, `color: ${config.color}; font-weight: bold;`, data);
    } else {
      consoleFn(styledMessage, `color: ${config.color}; font-weight: bold;`);
    }
  };
};

/**
 * Affiche des logs de débogage en console uniquement en mode développement.
 * @param message Le message principal à afficher.
 * @param data Données optionnelles à logger (objet, variable, etc.).
 */
export const debugLog = createLogger('debug');

/**
 * Affiche des logs d'information en console uniquement en mode développement.
 */
export const infoLog = createLogger('info');

/**
 * Affiche des logs d'avertissement en console uniquement en mode développement.
 */
export const warnLog = createLogger('warn');

/**
 * Affiche des logs d'erreur en console (toujours activé).
 */
export const errorLog = createLogger('error');

/**
 * Logger avec niveau personnalisé
 */
export const logWithLevel = (level: LogLevel, message: string, data?: any) => {
  createLogger(level)(message, data);
};

/**
 * Groupe de logs pour organiser les messages liés
 */
export const logGroup = (title: string, callback: () => void) => {
  if (!IS_DEVELOPMENT) return;
  
  console.group(`%c${title}`, 'color: #8b5cf6; font-weight: bold; font-size: 1.1em;');
  try {
    callback();
  } finally {
    console.groupEnd();
  }
};
