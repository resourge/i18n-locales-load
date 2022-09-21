# i18n-locales-load

`@resourge/i18n-locales-load` is a tool to help create and load translations into the the project without the messy JSON's.


## Features

- Build with typescript.
- Plugin to support Vite.js.
- Only the translation files are built into the production code.
- 100% javascript.
- Same variable for the translation "key" and to use with "t(...)".
- Prevents missing translations.
- Prevents having a different "keys" on the JSON and on the "t(...)".
- Built into "version" to making sure "production" will always have the newest version.
- Caches translations into localStorage.
- Loads translation on demand (only on production).

## Installation

Install using [Yarn](https://yarnpkg.com):

```sh
yarn add @resourge/i18n-locales-load
```

or NPM:

```sh
npm install @resourge/i18n-locales-load --save
```

## Setup

### Vite config

```Typescript
import { i18nLocalesLoad } from '@resourge/i18n-locales-load/i18nLocalesLoad'
import { defineConfig } from 'vite';

export default defineConfig({
	...,
	plugins: [
		...
		i18nLocalesLoad({
			// File where the translations will be created.
			translationFilePath: './src/assets/translations/Translations.ts'
		})
	]
})
```

### i18n

```Typescript
import { i18nLocalesBackend } from '@resourge/i18n-locales-load/i18nLocalesBackend';
import i18n from 'i18next';

i18n
...
.use(i18nLocalesBackend) 
.init(...)

export default i18n;

```
### Translations File

```Typescript
import { Translations } from '@resourge/i18n-locales-load'

export const TRANSLATIONS = Translations(['en', 'pt'], {
	HELLO: {
		en: 'Hello',
		pt: 'Olá'
	},
	RIMURU: {
		TEMPEST: {
			en: 'Rimuru Tempest',
			pt: 'Rimuru Tempest'
		},
		IS_BEST: {
			en: 'Is the best',
			pt: 'É o melhor'
		}
	}
})
```

## Usage

After the setup you are free to use it as you see fit.

_Note: './src/assets/translations/Translations' needs to be the same as [translationFilePath](###viteConfig) from the vite config_
### React
```Typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

import { TRANSLATIONS } from './src/assets/translations/Translations';

const Component = () => {
	const { t } = useTranslation();
	return (
		<div>
			{ t(TRANSLATIONS.HELLO) }
			{ t(TRANSLATIONS.RIMURU.TEMPEST) }
			{ t(TRANSLATIONS.RIMURU.IS_BEST) }
		</div>
	);
};

export default Component;
```

### Javascript / Other packages
```Typescript
import { t } from 'i18next';

t(TRANSLATIONS.HELLO)
```

## Webpack

I plan in the future to add a plugin for webpack.

## License

MIT Licensed.