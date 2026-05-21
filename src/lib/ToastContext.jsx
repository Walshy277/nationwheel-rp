import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 99999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
        {toasts.map(t => (
          <div key={t.id} onClick={() => removeToast(t.id)}
            style={{ padding: "10px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, lineHeight: 1.5, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s",
              ...(t.type === "error" ? { background: "rgba(231,76,60,0.92)", color: "#fff", border: "1px solid rgba(231,76,60,0.5)" }
                : t.type === "success" ? { background: "rgba(46,204,113,0.92)", color: "#fff", border: "1px solid rgba(46,204,113,0.5)" }
                : { background: "rgba(11,20,34,0.96)", color: "#d7e2f2", border: "1px solid rgba(78,128,190,0.35)" })
            }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
