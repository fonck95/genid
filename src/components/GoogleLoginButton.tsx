import { useAuth } from '../contexts/AuthContext';

interface GoogleLoginButtonProps {
  compact?: boolean;
  className?: string;
}

export function GoogleLoginButton({ compact = false, className = '' }: GoogleLoginButtonProps) {
  const { isAuthenticated, user, isLoading, error, login, logout, isOAuth2Available } = useAuth();

  if (!isOAuth2Available) {
    return (
      <div className={`google-auth-warning ${className}`}>
        <span className="warning-icon">⚠️</span>
        <span className="warning-text">OAuth2 no configurado</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`google-auth-loading ${className}`}>
        <div className="auth-spinner"></div>
        <span>Cargando...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`google-auth-user ${compact ? 'compact' : ''} ${className}`}>
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="user-avatar"
            referrerPolicy="no-referrer"
          />
        )}
        {!compact && (
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        )}
        <button className="btn-logout" onClick={logout} title="Cerrar sesion">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`google-auth-container ${className}`}>
      {error && <div className="auth-error">{error}</div>}
      <button className="btn-google-login" onClick={login}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        <span>Iniciar sesion con Google</span>
      </button>
    </div>
  );
}

/**
 * Compact badge version showing auth status
 */
export function AuthStatusBadge() {
  const { isAuthenticated, user, isOAuth2Available } = useAuth();

  if (!isOAuth2Available) {
    return (
      <span className="auth-badge not-configured" title="OAuth2 no configurado">
        <span className="badge-dot"></span>
        Sin OAuth
      </span>
    );
  }

  if (isAuthenticated && user) {
    return (
      <span className="auth-badge authenticated" title={`Conectado como ${user.email}`}>
        <span className="badge-dot"></span>
        Conectado
      </span>
    );
  }

  return (
    <span className="auth-badge not-authenticated" title="Inicia sesion para generar videos">
      <span className="badge-dot"></span>
      No conectado
    </span>
  );
}
