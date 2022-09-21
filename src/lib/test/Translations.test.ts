import { Translations } from '../Translations'

test('Translations', () => {
	const TRANSLATIONS = Translations(['en', 'pt'], {
		HOME: {
			en: 'Home',
			pt: 'Casa'
		}
	});

	expect(TRANSLATIONS.HOME)
	.toBe('HOME')
})
