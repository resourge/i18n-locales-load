import { gender, plural, Translations } from '../Translations'

test('Translations', () => {
	const TRANSLATIONS = Translations(['en', 'pt'], {
		HOME: {
			en: 'Home',
			pt: 'Casa'
		}
	});

	expect(TRANSLATIONS.HOME)
	.toBe('HOME')

	const TRANSLATIONS1 = Translations(['en', 'pt'], {
		HOME: {
			en: 'Home',
			pt: 'Casa'
		},
		SECOND_VERSION: {
			SECOND_HOME: {
				en: 'Home',
				pt: 'Casa'
			}
		},
		THIRD_VERSION: {
			THIRD_HOME: {
				en: 'Home',
				pt: 'Casa Verde'
			}
		}
	});

	expect(TRANSLATIONS1.SECOND_VERSION.SECOND_HOME)
	.toBe('SECOND_VERSION.SECOND_HOME')

	expect(TRANSLATIONS1.THIRD_VERSION.THIRD_HOME)
	.toBe('THIRD_VERSION.THIRD_HOME')
})

test('should test plural translation', () => {
	const TRANSLATIONS = Translations(['en', 'pt'], {
		PLURAL: plural({
			one: {
				en: 'one',
				pt: 'um'
			},
			other: {
				en: 'other',
				pt: 'outro'
			}
		})
	});

	expect(TRANSLATIONS.PLURAL)
	.toBe('PLURAL')

	expect((TRANSLATIONS as any)._languages.en.PLURAL_one)
	.toBe('one')
	expect((TRANSLATIONS as any)._languages.en.PLURAL_other)
	.toBe('other')
})

test('should test gender translation', () => {
	const TRANSLATIONS = Translations(['en', 'pt'], {
		GENDER: gender({
			female: {
				en: 'Female',
				pt: 'Femenino'
			},
			male: {
				en: 'Male',
				pt: 'Masculino'
			}
		})
	});

	expect(TRANSLATIONS.GENDER)
	.toBe('GENDER')

	expect((TRANSLATIONS as any)._languages.en.GENDER_female)
	.toBe('Female')
	expect((TRANSLATIONS as any)._languages.en.GENDER_male)
	.toBe('Male')
})
