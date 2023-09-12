let local_builded_translations: TranslationsConfiguration | undefined = undefined;
try {
    local_builded_translations = require('@/../.fasti18n.translations.json');
} catch (e) {
    local_builded_translations = undefined;
}

type TranslationsConfigurationResponse =
    | (Omit<Response, "json"> & {
        json: () => TranslationsConfiguration;
    })

export interface Trasnlations {

}

export interface TranslationsConfiguration {
    _id: string;
    source_language: string;
    target_languages: Array<string>;
    translations: object;
    created: string;
    last_modified: string;
}

export interface FastI18nConfiguration {
    api_key: string | undefined;
    project_id: string;
    update_ttl: number;
    startup_policy: string;
}

export enum StartPolicy {
    ONLINE, //Try to use the latest online translation or fallback to CACHE, this option will slow your application startup
    CACHE, //Try to use the latest local cache when application start or fallback to BUILD
    BUILD, //Use the release build when application start
}

export class FastI18nService {
    private api_key: string | undefined = undefined;
    private project_id: string = '';
    private update_ttl: number = 60 * 5; //Check the latest online translation every 5 min, and update the local cache if needed
    private startup_policy: keyof typeof StartPolicy = 'CACHE';
    // private builded_translations: Object | undefined = undefined;
    private cached_translations: TranslationsConfiguration | undefined = undefined;
    private local_builded_translations: TranslationsConfiguration | undefined = local_builded_translations;
    /**
     * List of CDN to retrieve the latest build configuration
     */
    private cdn_domains: Array<string> = ['https://fasti18n-cdn-dev.s3.gra.io.cloud.ovh.net'];
    private api_domains: Array<string> = ['http://127.0.0.1:3000'];


    public constructor(configuration: FastI18nConfiguration) {
        for (const key in configuration) {
            if (Object.keys(this).includes(key)) this[key] = configuration[key];
        }
        return this.start();
    }

    private start = async (): Promise<FastI18nService> => {
        return new Promise(async (resolve, reject) => {
            try {
                /**
                 * Await the local cache update from online
                 */
                if (this.startup_policy === 'ONLINE') await this.updateLocalCacheFromOnline().catch(() => { return; })

                /**
                 * TODO Load translations from cache (browser cache, service worker)
                 */
                if (this.startup_policy === 'CACHE') return;

                /**
                 * Load translations
                 */
                if (this.startup_policy === 'BUILD') await this.updateLocalCacheFromLocalBuild().catch(() => { return; })

                /**
                 * Start cache synchronisation if the policy is CACHE or ONLINE
                 */
                if (this.startup_policy !== 'BUILD') this.syncCacheTTL();

                resolve(this);
            } catch (e) {
                reject(e);
            }
        });
    }

    public getCachedConfiguration = () => {
        return this.cached_translations
    }

    public getTranslations = async () => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(this.cached_translations?.translations || {});
            } catch (e) {
                reject(e);
            }
        });
    }

    public getAvailableLang(): Array<string> | undefined {
        if (this.cached_translations?.source_language && this.cached_translations?.target_languages) {
            return [].concat([this.cached_translations?.source_language]).concat(this.cached_translations?.target_languages)
        } else {
            return undefined;
        }
    }

    public getFallbackLang(): string | undefined {
        return this.cached_translations?.source_language || undefined;
    }

    private syncCacheTTL = () => {
        setTimeout(() => {
            this.updateLocalCacheFromOnline();
            this.syncCacheTTL();
        }, this.update_ttl * 1000);
    }


    private updateLocalCacheFromLocalBuild = async (): Promise<any> => {
        return new Promise(async (resolve, reject) => {
            if (this.local_builded_translations !== undefined) {
                this.cached_translations = this.local_builded_translations;
                resolve(this.local_builded_translations);
            } else {
                reject('ErrorLoadFromBuild');
            }
        });
    };

    private updateLocalCacheFromOnline = async (): Promise<string | any> => {
        return new Promise(async (resolve, reject) => {
            try {
                await fetch(`${this.cdn_domains[0]}/${this.project_id}.json`, {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    }
                })
                    .then((response: any) => response.ok ? response : reject(response.status))
                    .then((response: TranslationsConfigurationResponse) => response.json())
                    .then((response: TranslationsConfiguration) => {
                        this.cached_translations = response;
                        resolve(this.cached_translations);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } catch (e) {
                console.log('catche');
                reject(e);
            }
        });
    }

    public async addKey(key: string, value: string = ''): Promise<string | any> {
        return new Promise(async (resolve, reject) => {
            try {
                const requestHeaders: HeadersInit = new Headers();
                requestHeaders.set('x-api-key', this.api_key || '');
                requestHeaders.set('Content-Type', 'application/json');
                requestHeaders.set('Accept', 'application/json');

                await fetch(`${this.api_domains[0]}/project/${this.project_id}/key/${key}`, {
                    method: "POST",
                    headers: requestHeaders,
                    body: JSON.stringify({
                        value,
                    }),
                })
                    .then((response: any) => {
                        if (response.ok) {
                            resolve(response.content.toJSON());
                        } else {
                            reject(response.status)
                        }
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } catch (e) {
                reject(e);
            }
        });
    }
}