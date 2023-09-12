import { FastI18nService, FastI18nConfiguration } from './index';

describe('Test fasti18n client js index.ts', () => {
    let fasti18n: FastI18nService;

    let configuration: FastI18nConfiguration = {};

    beforeEach(async () => fasti18n = await FastI18nService.create(configuration));

    test('should init service without update for offline translation', async () => {
        expect(fasti18n.getCachedConfiguration()).toBe(undefined);
        expect(fasti18n.getAvailableLang()).toBe(undefined);
        expect(fasti18n.getFallbackLang()).toBe(undefined);
        expect(fasti18n.getTranslations()).toEqual({});
    })

    configuration = {
        api_key: undefined,
        project_id: '',
        update_ttl: 5 * 60,
        startup_policy: 'BUILD'
    };
});