// URL base del backend para los servicios HTTP.
declare global {
	interface Window {
		__API_BASE_URL__?: string;
	}

	interface ImportMeta {
		env?: Record<string, string | undefined>;
	}
}

const browser = typeof window !== 'undefined';
const runtimeApiBase = browser ? window.__API_BASE_URL__ : undefined;
const envApiBase = import.meta.env?.['NG_APP_API_BASE_URL'] as string | undefined;
const host = browser ? window.location.hostname : '';
const isLocal = host === 'localhost' || host === '127.0.0.1';

export const API_BASE_URL = runtimeApiBase || envApiBase || (isLocal ? 'http://localhost:3000/api' : '/api');
