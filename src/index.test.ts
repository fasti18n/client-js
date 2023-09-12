import { FastI18nService, FastI18nConfiguration } from './index';

describe('Test fasti18n client js index.ts', () => {

    test('should init service without update for offline translation', async () => {
        const configuration: FastI18nConfiguration = {
            startup_policy: 'BUILD'
        };
        const fasti18n: FastI18nService = await FastI18nService.create(configuration)
        expect(fasti18n.getCachedConfiguration()).toBe(undefined);
        expect(fasti18n.getAvailableLang()).toBe(undefined);
        expect(fasti18n.getFallbackLang()).toBe(undefined);
        expect(fasti18n.getTranslations()).toEqual({});
    })

    test('should retrieve online translation for project test1', async () => {
        const configuration: FastI18nConfiguration = {
            api_key: undefined,
            project_id: 'test1',
            update_ttl: -1,
            startup_policy: 'ONLINE'
        };
        const fasti18n: FastI18nService = await FastI18nService.create(configuration)
        expect(fasti18n.getAvailableLang()).toEqual(['fr', 'en']);
        expect(fasti18n.getFallbackLang()).toEqual('fr');
        expect(fasti18n.getTranslations()).toEqual({
            "fr": {
                "Hello": "Bonjour"
            },
            "en": {
                "Hello": "Hello"
            }
        });
    })
});