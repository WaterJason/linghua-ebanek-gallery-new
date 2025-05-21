"use client"

import * as React from "react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 100000

type ToasterProps = {
  children: React.ReactNode
}

function Toaster({ children }: ToasterProps) {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <ToastProvider limit={TOAST_LIMIT} removeDelay={TOAST_REMOVE_DELAY}>
      {children}
      <ToastViewport />
    </ToastProvider>
  )
}

type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

type ActionType = typeof actionTypes

type ToastAction =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToastProps
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToastProps>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId: string
    }

interface State {
  toasts: ToastProps[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

let count_ = 0

const generateId = () => {
  count_ = (count_ + 1) % Number.MAX_VALUE
  return String(count_)
}

const reducer = (state: State, action: ToastAction): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action
      // ! Side effects ! - This could be extracted into a middleware.
      if (toastId) {
        toastTimeouts.has(toastId) && clearTimeout(toastTimeouts.get(toastId))
        return {
          ...state,
          toasts: state.toasts.map((t) => (t.id === toastId ? { ...t, open: false } : t)),
        }
      } else {
        return {
          ...state,
          toasts: state.toasts.map((t) => ({ ...t, open: false })),
        }
      }
    }
    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

type DispatchType = React.Dispatch<ToastAction>

const DEFAULT_VALUE: {
  state: State
  dispatch: DispatchType
  toast: (props: ToastProps) => void
  dismiss: (toastId?: string) => void
} = {
  state: { toasts: [] },
  dispatch: () => null,
  toast: () => console.warn("Forgot to wrap component in `ToastProvider`."),
  dismiss: () => console.warn("Forgot to wrap component in `ToastProvider`."),
}

const ToastContext = React.createContext(DEFAULT_VALUE)

function useToast() {
  return React.useContext(ToastContext)
}

type ToastProviderProps = {
  children: React.ReactNode
}

function ToastProvider({ children }: ToastProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] })

  const toast = React.useCallback(
    ({ ...props }: ToastProps) => {
      const id = generateId()

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) dismiss(id)
          },
        },
      })

      if (props.duration) {
        toastTimeouts.set(
          id,
          setTimeout(() => {
            dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })
          }, props.duration),
        )
      }
    },
    [dispatch],
  )

  const dismiss = React.useCallback(
    (toastId?: string) => {
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId: toastId })
    },
    [dispatch],
  )

  React.useEffect(() => {
    return () => {
      state.toasts.forEach((toast) => {
        toastTimeouts.has(toast.id) && clearTimeout(toastTimeouts.get(toast.id))
      })
    }
  }, [state.toasts])

  return (
    <ToastContext.Provider
      value={{
        state,
        dispatch,
        toast,
        dismiss,
      }}
    >
      <Toaster>{children}</Toaster>
    </ToastContext.Provider>
  )
}

export { Toast, ToastClose, ToastDescription, ToastTitle, ToastProvider, ToastViewport, useToast, toast }

const toast = (props: ToastProps) => {
  DEFAULT_VALUE.toast(props)
}
