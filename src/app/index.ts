// ====================
// APPLICATION
// ====================
export {App} from './app';
export {appConfig} from './app.config';
export {routes} from './app.routes';

// ====================
// CORE
// ====================
// export * as Core from './core';

// ====================
// SHARED
// ====================
// export * as Shared from './shared';

// ====================
// STORE
// ====================
// export * as Store from './stores';

// ====================
// MODULES
// ====================
// export * as Modules from './modules';

// ====================
// TYPES
// ====================
// export type { RootState } from './stores/root.reducer';
// export type { User } from './shared/models/user.model';

// ====================
// CONSTANTS
// ====================
export const APP_CONSTANTS = {
  NAME: 'Тестирование форм интерфейса',
  VERSION: '0.0.1',
  // API_TIMEOUT: 30000,
  // RETRY_ATTEMPTS: 3,
  NODE: '24.21.0',
  NPM: '11.19.0'
} as const;

// ====================
// RE-EXPORTS FOR CONVENIENCE
// ====================

// Часто используемые сущности
// export { AuthService } from './core/services/auth.service';
// export { ApiService } from './core/services/api.service';
// export { ButtonComponent } from './shared/ui/button';
// export { ModalComponent } from './shared/ui/modal';
// export { NotificationService } from './core/services/notification.service';
