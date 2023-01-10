type TranslationsWithoutLangs<T extends object, Langs extends string> = { 
	[K in keyof T]: T[K]
} & {
	[K in Langs]?: never
}

export type TranslationsType<
	Langs extends string
> = {
	[k: string]:
	Record<Langs, string> | { [K in Langs]: string } | (
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

const setLangs = <Langs extends string>(
	key: string, 
	value: object, 
	languages: Langs[] | readonly Langs[],
	_languages: Record<string, Record<string, string>>
) => {
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

		_languages[lang][key] = val
	})
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

		if ( (value as any)._custom ) {
			const pluralKey = `${_baseKey}${key}`;
			obj[key] = pluralKey;

			Object.entries(value)
			.filter(([key]) => key !== '_custom')
			.forEach(([key, value]) => {
				const _key = `${pluralKey}_${key}`;

				setLangs(
					_key,
					value,
					languages,
					_languages
				);
			})

			return obj
		}

		if ( 
			Object.keys(value)
			.some((key) => languages.includes(key as Langs)) 
		) {
			const _key = `${_baseKey}${key}`;
			obj[key] = _key;

			setLangs(
				_key,
				value,
				languages,
				_languages
			);
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

export const gender = <Langs extends string>(
	langs: {
		female: { [K in Langs]: string }
		male: { [K in Langs]: string }
	}
): { [K in Langs]: string } => {
	return {
		_custom: true,
		...langs
	} as unknown as { [K in Langs]: string }
}

/**
 t('key', {count: 0}); // -> "zero"
 t('key', {count: 1}); // -> "one"
 t('key', {count: 2}); // -> "two"
 t('key', {count: 3}); // -> "few"
 t('key', {count: 4}); // -> "few"
 t('key', {count: 5}); // -> "few"
 t('key', {count: 11}); // -> "many"
 t('key', {count: 99}); // -> "many"
 t('key', {count: 100}); // -> "other"
 */
export const plural = <Langs extends string>(
	langs: {
		one: { [K in Langs]: string }
		other: { [K in Langs]: string }
		few?: { [K in Langs]: string }
		many?: { [K in Langs]: string }
		two?: { [K in Langs]: string }
		zero?: { [K in Langs]: string }
	}
): { [K in Langs]: string } => {
	return {
		_custom: true,
		...langs
	} as unknown as { [K in Langs]: string }
}
