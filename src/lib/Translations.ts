type TranslationsWithoutLangs<T extends object, Langs extends string> = { 
	[K in keyof T]: T[K]
} & {
	[K in Langs]?: never
}

export type TranslationsType<
	Langs extends string
> = {
	[k: string]:
	Record<Langs, string> | (
		TranslationsWithoutLangs<TranslationsType<Langs>, Langs>
	)
}

export type TranslationsKeys<
	Langs extends string,
	T extends Record<string, any>, 
	BaseKey extends string | undefined = undefined
> = {
	[K in keyof T]: Langs extends keyof T[K]
		? `${BaseKey extends string ? `${BaseKey}.` : ''}${T[K]}` 
		: TranslationsKeys<Langs, T[K], `${BaseKey extends string ? `${BaseKey}.` : ''}${K extends string ? K : ''}`>
}

const getTranslations = <Langs extends string, T extends TranslationsType<Langs>>(
	languages: Langs[] | readonly Langs[],
	translations: T, 
	baseKey: string = '',
	_languages: Record<string, Record<string, string>>
) => {
	return Object
	.entries(translations)
	.reduce<any>((obj, [key, value]) => {
		const _baseKey = baseKey ? `${baseKey}.` : '';

		if ( 
			Object.keys(value)
			.some((key) => languages.includes(key as Langs)) 
		) {
			const _key = `${_baseKey}${key}`;
			obj[key] = _key;

			const langs = Object.entries<string>(value as Record<any, any>)

			if ( langs.length !== languages.length ) {
				const missingLangs = langs.filter(([lang]) => !languages.includes(lang as Langs));

				throw new Error(`Missing ${missingLangs.join(', ')} for key: '${key}'`)
			}

			langs
			.forEach(([lang, val]) => {
				if ( !_languages[lang] ) {
					_languages[lang] = {};
				}

				_languages[lang][_key] = val
			})
		}
		else {
			obj[key] = getTranslations(languages, value as TranslationsType<Langs>, `${_baseKey}${key}`, _languages)
		}

		return obj;
	}, {})
}

export const Translations = <Langs extends string, T extends TranslationsType<Langs>>(
	languages: Langs[] | readonly Langs[],
	translations: T
): TranslationsKeys<Langs, T> => {
	const _languages = (languages as Langs[])
	.reduce<Record<string, Record<string, string>>>((obj, lang) => {
		obj[lang] = {};

		return obj;
	}, {});

	const keys = getTranslations(languages, translations, '', _languages);

	keys._languages = _languages

	return keys;
}
