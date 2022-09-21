import { Translations } from '../Translations'

test('Translations', () => {
	const TRANSLATIONS = Translations(['en'], {
		HOME: {
			en: 'Home'
		}
	});

	expect(TRANSLATIONS.HOME)
	.toBe('HOME')
})
