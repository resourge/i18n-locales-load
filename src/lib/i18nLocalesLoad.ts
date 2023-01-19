import fs from 'fs';
import path from 'path';
import touch from 'touch';
import { ConfigLoaderSuccessResult, createMatchPath, loadConfig } from 'tsconfig-paths';
import type { CompilerOptions } from 'typescript';
import ts from 'typescript';
import { PluginOption } from 'vite';

import { TranslationsKeys } from './Translations';

const {
	ScriptTarget,
	ModuleKind,
	ModuleResolutionKind
} = ts;

type I18nLocalesLoadConfig = {
	// Translation file location
	translationFilePath: string
}

const tsConfig = loadConfig();

function watchMain(
	fileNames: string[],
	newTranslationFile: string, 
	localesFilePath: string,
	options: CompilerOptions
) {
	const { outDir } = options;
	if ( tsConfig.resultType === 'failed' ) {
		throw new Error();
	}

	const resolvePath = createMatchPath(
		path.resolve(tsConfig.absoluteBaseUrl, outDir ?? ''), 
		tsConfig.paths, 
		tsConfig.mainFields, 
		tsConfig.addMatchAll
	);

	let _TRANSLATION: TranslationsKeys<string, {}> & { _languages: Record<string, any> } | null = null;

	const host = ts.createWatchCompilerHost(
		fileNames,
		options,
		ts.sys,
		ts.createSemanticDiagnosticsBuilderProgram,
		undefined,
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async (diagnostics) => {
			if (diagnostics.code !== 6031) {
				const { TRANSLATIONS } = await import(`file://${newTranslationFile}?date=${new Date()
				.toISOString()}`);
				
				if ( !fs.existsSync(localesFilePath) ) {
					await fs.promises.mkdir(localesFilePath, {
						recursive: true 
					})
				}
	
				_TRANSLATION = TRANSLATIONS
	
				const { _languages: languages } = TRANSLATIONS;
	
				await Promise.all(
					Object.entries(languages)
					.map(async ([language, translations]) => {
						const filePath = path.join(localesFilePath, `${language}.ts`)
	
						await fs.promises.writeFile(filePath, `export const translations = ${JSON.stringify(translations)}`);
					})
				);
			}
		},
		undefined,
		{
			watchFile: ts.WatchFileKind.PriorityPollingInterval
		}
	);

	const originalAfterProgramCreate = host.afterProgramCreate
	host.afterProgramCreate = builderProgram => {
		const originalEmit = builderProgram.emit
		builderProgram.emit = (targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers): ts.EmitResult => {
			const transformers = customTransformers ?? {
				before: [] 
			}
			if (!transformers.before) transformers.before = []
			transformers.before.push(
				(context) => {
					const { factory } = context;
					return (rootNode) => {
						return factory.updateSourceFile(
							rootNode,
							rootNode.statements.map((node: any) => {
								if (node.moduleSpecifier) {
									if (node.moduleSpecifier.text.includes('src')) {
										return factory.updateImportDeclaration(
											node,
											node.modifiers,
											node.importClause,
											factory.createStringLiteral(
												resolvePath(
													`${node.moduleSpecifier.text as string}.js`
												) ?? ''
											),
											node.assertClause
										)
									}
								}
								return node;
							})
						);
					}
				}
			)

			return originalEmit(targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, transformers)
		}
		if (originalAfterProgramCreate) originalAfterProgramCreate(builderProgram)
	}

	const { close } = ts.createWatchProgram(host);

	return {
		getTranslation: (): (TranslationsKeys<string, {}, undefined> & {
			_languages: Record<string, any>
		}) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return _TRANSLATION!
		},
		close: () => {
			close()
		}
	}
}
  
export const i18nLocalesLoad = ({ translationFilePath }: I18nLocalesLoadConfig): PluginOption => {
	const projectPath = (tsConfig as ConfigLoaderSuccessResult).absoluteBaseUrl;
	const _translationFilePath = path.resolve(projectPath, translationFilePath)

	const fileLanguages = new Map<string, string>();
	const cacheOutDir = path.resolve(projectPath, '.cache');

	const newTranslationFile = path.join(cacheOutDir, translationFilePath.replace('.ts', '.js'))
	const localesFilePath = path.resolve(cacheOutDir, 'locales')

	// Creates the translations when reading from translation file
	const { getTranslation, close } = watchMain(
		[_translationFilePath],
		newTranslationFile,
		localesFilePath,
		{
			noEmitOnError: false,
			noImplicitAny: true,
			target: ScriptTarget.ES2016,
			module: ModuleKind.ES2020,
			moduleResolution: ModuleResolutionKind.NodeJs,
			outDir: cacheOutDir,
			baseUrl: path.resolve(projectPath, './'),
			rootDir: path.resolve(projectPath, './'),
			types: ['vite/client'],
			paths: (tsConfig as ConfigLoaderSuccessResult).paths
		}
	);

	const i18nLocalesBackendDynamicImport = 'i18nLocalesBackend-dynamic-import';
	let i18nLocalesBackendFilePath = '';

	return {
		name: 'i18nLocalesLoad',
		enforce: 'pre',
		config: (config, { command }) => {
			if (!config.define ) {
				config.define = {}
			}

			(config.define['process.env'] || (config.define['process.env'] = {})).i18n_unique_id = command === 'build' ? Date.now() : false;

			return config;
		},
		buildEnd: () => {
			close();
		},
		closeWatcher: () => {
			close();
		},
		transform: async function (content, id) {
			if ( id.includes(_translationFilePath) ) {
				const { _languages: languages, ...keys } = getTranslation();

				const languageKeys = Object.keys(languages);

				if ( fileLanguages.size !== 0 && fileLanguages.size !== languageKeys.length && i18nLocalesBackendFilePath ) {
					await touch(i18nLocalesBackendFilePath);
				}

				// Replaces Translation file content with keys only
				return content.replace(/Translations\([^]*\)/g, JSON.stringify(keys))
			}

			// Locales i18nLocalesBackend and transforms i18nLocalesBackendDynamicImport 
			// into a object containing all locales files
			if ( content.includes(i18nLocalesBackendDynamicImport) ) {
				const { _languages: languages } = getTranslation();

				i18nLocalesBackendFilePath = id;
				// Replaces 'i18nLocalesBackendDynamicImport' with an object containing all translations paths
				return content.replace(
					new RegExp(`['"]${i18nLocalesBackendDynamicImport}['"]`), 
					[
						'{',
						...Object.keys(languages)
						.map((language) => {
							const filePath = path.join(localesFilePath, `${language}.ts`)

							this.addWatchFile(filePath);

							return `${language}: () => import('${filePath.replace(/\\/g, '/')}'),`
						}),
						'}'
					].join('')
				)
			}
			return content
		}
	}
}
