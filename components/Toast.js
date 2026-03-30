import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2 pointer-events-none">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl shadow-lg text-sm font-medium max-w-xs pointer-events-auto animate-slide-in ${
              type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}
          >
            {type === 'error'
              ? <XCircle size={15} className="shrink-0" />
              : <CheckCircle size={15} className="shrink-0" />}
            <span className="flex-1">{message}</span>
            <button
              onClick={() => remove(id)}
              className="opacity-50 hover:opacity-100 transition-opacity ml-1"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const fn = useContext(ToastContext)
  return fn || (() => {})
}
