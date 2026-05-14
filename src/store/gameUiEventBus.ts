import type { UiEventBus, UiEventHandler, UiEventPayloadMap } from "../types/uiContract";

function createGameUiEventBus(): UiEventBus {
  const listeners = new Map<keyof UiEventPayloadMap, Set<UiEventHandler<keyof UiEventPayloadMap>>>();

  return {
    emit(eventName, payload) {
      const eventListeners = listeners.get(eventName);

      if (!eventListeners) {
        return;
      }

      eventListeners.forEach((handler) => {
        handler(payload);
      });
    },
    subscribe(eventName, handler) {
      const eventListeners = listeners.get(eventName) ?? new Set();
      eventListeners.add(handler as UiEventHandler<keyof UiEventPayloadMap>);
      listeners.set(eventName, eventListeners);

      return () => {
        const nextListeners = listeners.get(eventName);

        if (!nextListeners) {
          return;
        }

        nextListeners.delete(handler as UiEventHandler<keyof UiEventPayloadMap>);

        if (nextListeners.size === 0) {
          listeners.delete(eventName);
        }
      };
    },
  };
}

export const gameUiEventBus = createGameUiEventBus();
