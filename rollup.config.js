import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import dts from 'rollup-plugin-dts';
import filsesize from 'rollup-plugin-filesize';

import { 
	name,
	author,
	license
} from './package.json';

const external = ['i18next', 'vite', 'typescript', 'touch', 'tsconfig-paths'];
const globals = {}

const babelPlugins = [
	'babel-plugin-dev-expression'
]

const babelPresetEnv = ['@babel/preset-env', { 
	targets: [
		'defaults',
		'not IE 11',
		'maintained node versions'
	],
	loose: true,
	bugfixes: true
}]


const defaultExtPlugin = [
	filsesize({
		showBeforeSizes: 'build'
	}),
	nodeResolve({
		extensions: ['.tsx', '.ts']

	})
]

function createBanner(libraryName, version, authorName, license) {
	return `/**
 * ${libraryName} v${version}
 *
 * Copyright (c) ${authorName}.
 *
 * This source code is licensed under the ${license} license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license ${license}
 */`;
}
function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function getName(name) {
	const arr = name.split('/');

	return arr[arr.length - 1];
}

/**
 * Package Json info
 */
const VERSION = process.env.PROJECT_VERSION;
const AUTHOR_NAME = author;
const LICENSE = license;

const getPackage = (
	OUTPUT_DIR,
	inputs,
	PACKAGE_NAME
) => {
	const PROJECT_NAME = getName(PACKAGE_NAME);

	/**
	 * Options
	 */
	const sourcemap = true;
	const banner = createBanner(PROJECT_NAME, VERSION, AUTHOR_NAME, LICENSE);
	const umdName = PROJECT_NAME.split('-').map(capitalizeFirstLetter).join('')

	// JS modules for bundlers
	const modules = [
		...Object.entries(inputs)
		.map(([key, value]) => {
			return ({
				input: value,
				output: {
					file: `${OUTPUT_DIR}/${key}.mjs`,
					format: 'esm',
					sourcemap: false,
					banner: banner
				},
				external,
				plugins: [
					replace({
						preventAssignment: true,
						delimiters: ['\\b', '\\b(?!\\.)'],
						values: {
							postalCodes: 'schemas',
							phoneNumbers: 'phoneNumbers'
						}
					}),
					...defaultExtPlugin,
					babel({
						exclude: /node_modules/,
						babelHelpers: 'bundled',
						presets: [
							babelPresetEnv,
							['@babel/preset-react', {
								useBuiltIns: true
							}],
							['@babel/preset-typescript', {
								optimizeConstEnums: true
							}]
						],
						plugins: babelPlugins,
						extensions: ['.ts', '.tsx']
					})
				]
			})
		}),
		{
			input: inputs,
			output: {
				dir: OUTPUT_DIR,
				format: 'esm',
				banner: banner
			},
			plugins: [
				dts()
			]
		}
	];

	return modules;
}

export default function rollup() {
	return [
		...getPackage(
			'./dist',
			{
				'i18nLocalesBackend': './src/lib/i18nLocalesBackend.ts',
				'i18nLocalesLoad': './src/lib/i18nLocalesLoad.ts',
				'Translations': './src/lib/Translations.ts'
			},
			name
		)
	];
}
