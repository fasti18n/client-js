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

    test('should retrieving translation from local build', async () => {
        const configuration: FastI18nConfiguration = {
            startup_policy: 'BUILD',
            project_id: 'wrongProject'
        };
        const mockTranslation = {
            _id: "test1",
            source_language: "fr",
            target_languages: [
                "en"
            ],
            translations: {
                fr: {
                    "Hello": "Bonjour"
                },
                en: {
                    "Hello": "Hello"
                }
            },
            created: "2023-09-06T14:11:18.514Z",
            last_modified: "2023-09-06T14:11:18.514Z"
        }

        //Start
        const fasti18n: FastI18nService = await FastI18nService.create(configuration)
        fasti18n['local_builded_translations'] = mockTranslation;
        await fasti18n['updateLocalCacheFromLocalBuild']();
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
    });

    test('should failed retrieving bad online project', async () => {
        const configuration: FastI18nConfiguration = {
            startup_policy: 'BUILD',
            project_id: 'wrongProject'
        };
        const fasti18n: FastI18nService = await FastI18nService.create(configuration)
        const error = await fasti18n['updateLocalCacheFromOnline']().catch(e => {
            return e.toString();
        })
        expect(error).toBe('403');
    });

    test('should failed retrieving online project with bad json', async () => {
        const configuration: FastI18nConfiguration = {
            startup_policy: 'BUILD',
            project_id: 'test1JsonError'
        };
        const fasti18n: FastI18nService = await FastI18nService.create(configuration)
        const error = await fasti18n['updateLocalCacheFromOnline']().catch(e => {
            return e.toString();
        })
        expect(error).toBe('SyntaxError: Unexpected string in JSON at position 99');
    });

    test('should failed retrieving project with bad CDN url', async () => {
        const configuration: FastI18nConfiguration = {
            startup_policy: 'BUILD',
            project_id: 'test1JsonError'
        };
        const fasti18n: FastI18nService = await FastI18nService.create(configuration)
        fasti18n['cdn_domains'] = ['https://0.0.0.0']
        const error = await fasti18n['updateLocalCacheFromOnline']().catch(e => {
            return e.toString();
        })
        expect(error).toBe('TypeError: fetch failed');
    });

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

    test('should update translation according to the update_ttl', async () => {
        const configuration: FastI18nConfiguration = {
            api_key: undefined,
            project_id: 'test1',
            update_ttl: -1,
            startup_policy: 'ONLINE'
        };
        const fasti18n: FastI18nService = await FastI18nService.create(configuration)
        fasti18n['cached_translations'] = undefined;
        fasti18n['update_ttl'] = 1;
        fasti18n['syncCacheTTL']();

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 2000);
        });

        fasti18n['update_ttl'] = -1;

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

    test('should failed adding a new key using wrong api url', async () => {
        const configuration: FastI18nConfiguration = {
            api_key: undefined,
            project_id: 'test1',
            update_ttl: -1,
            startup_policy: 'BUILD'
        };
        const fasti18n: FastI18nService = await FastI18nService.create(configuration)
        fasti18n['api_domains'] = ['https://0.0.0.0'];
        const error = await fasti18n.addKey('newKey')
            .catch(e => {
                return e.toString();
            })
        expect(error).toBe('TypeError: fetch failed');
    })

});