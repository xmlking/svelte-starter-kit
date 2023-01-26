// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
import { DefaultSession } from '@auth/core/types';
declare global {
	namespace App {
		interface Session {
			user?: {
				id?: string;
			} & DefaultSession['user'];
			token?: string;
			roles?: string[];
		}
		interface Error {
			message: string; // this property is always required, to provide a sensible fallback
			context?: Record<string, any>;
		}

		interface Locals {
			// session: Session;
			getSession(): Promise<Session | null>;
		}
		interface PageData {
			session: Session | null;
		}
		// interface Platform {}
		interface Metadata {
			backendToken?: string | null;
			useRole?: string | null;
		}
	}

	// App version from package.json
	declare const __APP_VERSION__: string;
	// Git commit tag or hash
	declare const __GIT_TAG__: string;
	// Date of last commit
	declare const __GIT_DATE__: string;
}

export {};

