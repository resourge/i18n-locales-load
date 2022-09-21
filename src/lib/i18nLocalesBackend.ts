import {
	BackendModule,
	InitOptions,
	MultiReadCallback,
	ReadCallback,
	Services
} from 'i18next'

type i18nLocalesBackendConfig = {
	expirationTime: number
	prefix: string
	storage: Storage
	request?: (language: string) => Promise<Record<string, any>>
}

type LocalStorageData = {
	data: Record<string, any>
	i18nStamp: number
	i18nVersion: string
}

const getDefaultBackendOptions = (): i18nLocalesBackendConfig => ({
	expirationTime: 7 * 24 * 60 * 60 * 1000,
	prefix: 'i18next_res_',
	storage: window.localStorage
})

export class i18nLocalesBackend implements BackendModule<i18nLocalesBackendConfig> {
	public static type: 'backend' = 'backend';
	public type: 'backend' = 'backend';

	public services: Services;
	public backendOptions: i18nLocalesBackendConfig;
	public i18nextOptions: InitOptions;
	public translations: Record<string, () => Promise<{ translations: Record<string, any> }>>;

	constructor(
		services: Services, 
		backendOptions: i18nLocalesBackendConfig = getDefaultBackendOptions(), 
		i18nextOptions = {}
	) {
		// @ts-expect-error This string will be replaced with the actual object containing all 
		// locales imports
		this.translations = 'i18nLocalesBackend-dynamic-import';
		this.services = services;
		this.backendOptions = {
			...getDefaultBackendOptions(),
			...backendOptions
		};
		this.i18nextOptions = i18nextOptions;
	}

	public init(services: Services, backendOptions: i18nLocalesBackendConfig, i18nextOptions: InitOptions) {
		this.services = services;
		this.backendOptions = {
			...getDefaultBackendOptions(),
			...backendOptions
		};
		this.i18nextOptions = i18nextOptions;
	}

	private getVersion(language: string) {
		if ( process.env.i18n_unique_id ) {
			return `${language}_${String(process.env.i18n_unique_id)}`
		}

		return false
	}

	private getKey(language: string) {
		return `${this.backendOptions.prefix}${language}`
	}

	private async requestLanguage(language: string, namespace: string): Promise<Record<string, any>> {
		const nowMS = new Date()
		.getTime();

		const local: string | null = this.backendOptions.storage
		.getItem(this.getKey(language));

		if ( local ) {
			const localResult: LocalStorageData = JSON.parse(local);
			const version = this.getVersion(language);
	
			if (
				localResult.i18nStamp && 
				localResult.i18nStamp + this.backendOptions.expirationTime > nowMS && // there should be no language version set, or if it is, it should match the one in translation
				(
					version && version === localResult.i18nVersion
				)
			) {
				return localResult.data;
			}
		}

		const data = this.backendOptions.request 
			? (await this.backendOptions.request(language))
			: (await this.translations[language]()).translations;

		if ( Object.keys(data).length ) {
			this.save(language, namespace, data)
		}

		return data;
	}

	public read(language: string, namespace: string, callback: ReadCallback) {
		this.requestLanguage(language, namespace)
		.then((requestKeys) => callback(null, requestKeys))
		.catch((err) => callback(err, false))
	}

	// optional
	public readMulti(languages: string[], namespaces: string[], callback: MultiReadCallback) {
		Promise.all(
			languages.map((language) => this.requestLanguage(language, namespaces[0]))
		)
		.then((translations: Array<Record<string, any>>) => {
			callback(null, 
				languages
				.reduce<Record<string, any>>((obj, language, index) => {
					obj[language] = translations[index]
	
					return obj;
				}, {})
			);
		})
		.catch((err) => {
			callback(err, null);
		})
	}

	// only used in backends acting as cache layer
	public save(language: string, _namespace: string, data: Record<string, any>) {
		this.backendOptions.storage.setItem(this.getKey(language), JSON.stringify({
			data,
			i18nStamp: new Date()
			.getTime(),
			i18nVersion: this.getVersion(language)
		}));
	}

	/** Save the missing translation */
	public create(_languages: string[], _namespace: string, _key: string, _fallbackValue: string) {}
}

declare module 'i18next' {
	interface PluginOptions {
		backend?: i18nLocalesBackendConfig
	}
}
