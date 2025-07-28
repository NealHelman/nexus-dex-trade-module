import { NotificationProps } from 'components/Notification';
import { SnackBarType } from 'components/SnackBar';
import { atom } from 'jotai';
import { store } from 'lib/store';
import { ComponentType, ReactNode } from 'react';

const newModalId = (function () {
  let counter = 1;
  return () => `modal-${counter++}`;
})();

const newNotifId = (function () {
  let counter = 1;
  return () => `notif-${counter++}`;
})();

const newTaskId = (function () {
  let counter = 1;
  return () => `task-${counter++}`;
})();

/**
 * Types
 * ===========================
 */
export interface ModalDescriptor {
  id: string;
  component: ComponentType<any>;
  props?: any;
}

export interface NotificationDescriptor {
  id: string;
  content: ReactNode;
  type?: SnackBarType;
  autoClose?: number;
}

export interface BackgroundTaskDescriptor {
  id: string;
  component: ComponentType<any>;
  props?: any;
}

/**
 * Atoms
 * ===========================
 */
export const modalsAtom = atom<ModalDescriptor[]>([]);
export const notificationsAtom = atom<NotificationDescriptor[]>([]);
export const backgroundTasksAtom = atom<BackgroundTaskDescriptor[]>([]);
export const rqDevToolsOpenAtom = atom(false);
export const jotaiDevToolsOpenAtom = atom(false);

/**
 * Modal
 * ===========================
 */
export function openModal<TProps extends Record<string, any>>(
  component: ComponentType<TProps>,
  props?: TProps
) {
  const id = newModalId();
  store.set(modalsAtom, (modals) => [
    ...modals,
    {
      id,
      component,
      props,
    },
  ]);
  return id;
}

// Using regular function here to avoid circular dependency which causes error
export function removeModal(modalId?: string) {
  store.set(modalsAtom, (modals) =>
    modals.filter((modal) => modal.id !== modalId)
  );
}

export function isModalOpen(modalComponent: ComponentType) {
  const modals = store.get(modalsAtom);
  return modals.some(({ component }) => component === modalComponent);
}

/**
 * Notification
 * ===========================
 */
export function showNotification(
  content: ReactNode,
  options?:
    | NotificationProps['type']
    | Omit<NotificationProps, 'notifID' | 'index'>
) {
  const id = newNotifId();
  store.set(notificationsAtom, (notifications) => [
    {
      id,
      content,
      ...(typeof options === 'string' ? { type: options } : options),
    },
    ...notifications,
  ]);
  return id;
}

export function removeNotification(notifId: string) {
  store.set(notificationsAtom, (notifications) =>
    notifications.filter((notification) => notification.id !== notifId)
  );
}

/**
 * Background task
 * ===========================
 */
export function showBackgroundTask<TProps extends Record<string, any>>(
  component: ComponentType<TProps>,
  props?: Omit<TProps, 'index'>
) {
  const id = newTaskId();
  store.set(backgroundTasksAtom, (backgroundTasks) => [
    ...backgroundTasks,
    {
      id,
      component,
      props,
    },
  ]);
  return id;
}

export function removeBackgroundTask(taskId: string) {
  store.set(backgroundTasksAtom, (tasks) =>
    tasks.filter((task) => task.id !== taskId)
  );
}
