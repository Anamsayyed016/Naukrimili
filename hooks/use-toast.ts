"use client";

// Clean minimal toast system (shadcn/ui style) replacing corrupted file.
import * as React from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

type Action =
  | { type: typeof actionTypes.ADD_TOAST; toast: ToasterToast }
  | { type: typeof actionTypes.UPDATE_TOAST; toast: Partial<ToasterToast> }
  | { type: typeof actionTypes.DISMISS_TOAST; toastId?: string }
  | { type: typeof actionTypes.REMOVE_TOAST; toastId?: string };

interface State { toasts: ToasterToast[] }

let count = 0;
function genId() { count = (count + 1) % Number.MAX_SAFE_INTEGER; return count.toString(); }

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map(t => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;
      if (toastId) addToRemoveQueue(toastId); else state.toasts.forEach(t => addToRemoveQueue(t.id));
      return {
        ...state,
        toasts: state.toasts.map(t => (toastId === undefined || t.id === toastId ? { ...t, open: false } : t)),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) return { ...state, toasts: [] };
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.toastId) };
    default:
      return state;
  }
};

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach(l => l(memoryState));
}

type Toast = Omit<ToasterToast, 'id'>;

export function toast(props: Toast) {
  const id = genId();
  const update = (t: Partial<ToasterToast>) => dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...t, id } });
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => { if (!open) dismiss(); },
    } as ToasterToast,
  });
  return { id, dismiss, update };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1); };
  }, []);
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export type { ToastActionElement };
