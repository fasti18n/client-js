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
    api_key?: string;
    project_id?: string;
    update_ttl?: number;
    startup_policy?: keyof typeof StartPolicy;
}

export enum StartPolicy {
    ONLINE, //Try to use the latest online translation or fallback to CACHE, this option will slow your application startup
    CACHE, //Try to use the latest local cache when application start or fallback to BUILD
    BUILD, //Use the release build when application start
}

export class FastI18nService {
    private api_key: string | undefined = undefined;
    private project_id: string = '';
    private update_ttl: number = 60 * 5; //Check the latest online translation every 5 min, and update the local cache if needed, set -1 to disable this option
    private startup_policy: keyof typeof StartPolicy = 'CACHE';
    // private builded_translations: Object | undefined = undefined;
    private cached_translations: TranslationsConfiguration | undefined = undefined;
    private local_builded_translations: TranslationsConfiguration | undefined = local_builded_translations;
    /**
     * List of CDN to retrieve the latest build configuration
     */
    private cdn_domains: Array<string> = ['https://fasti18n-cdn-dev.s3.gra.io.cloud.ovh.net'];
    private api_domains: Array<string> = ['http://127.0.0.1:3000'];


    private constructor(configuration: FastI18nConfiguration = {}) {
        if (configuration.api_key) this.api_key = configuration.api_key;
        if (configuration.project_id) this.project_id = configuration.project_id;
        if (configuration.startup_policy) this.startup_policy = configuration.startup_policy;
        if (configuration.update_ttl) this.update_ttl = configuration.update_ttl;
        if (this.update_ttl > 0 && this.update_ttl < 60) this.update_ttl = 60;
        return this;
    }

    public static create = async (configuration: FastI18nConfiguration = {}): Promise<FastI18nService> => {
        const fasti18n = new FastI18nService(configuration);
        await fasti18n.start();
        return fasti18n;
    }

    private start = async (): Promise<FastI18nService> => {
        /**
         * Await the local cache update from online
         */
        if (this.startup_policy === 'ONLINE') await this.updateLocalCacheFromOnline().catch(() => { return; })
        /**
         * TODO Load translations from cache (browser cache, service worker)
         */
        // if (this.startup_policy === 'CACHE') await this.updateLocalCacheFromCacheStrategy().catch(() => { return; });

        /**
         * Load translations
         */
        if (this.startup_policy === 'BUILD') await this.updateLocalCacheFromLocalBuild().catch(() => { return; })

        /**
         * Start cache synchronisation if the policy is CACHE or ONLINE
         */
        if (this.startup_policy !== 'BUILD' && this.update_ttl > 0) this.syncCacheTTL();

        return (this);
    }

    public getCachedConfiguration = () => {
        return this.cached_translations
    }

    public getTranslations = () => {
        return this.cached_translations?.translations || {};
    }

    public getAvailableLang(): Array<string> | undefined {
        if (this.cached_translations?.source_language && this.cached_translations?.target_languages) {
            return ([] as string[]).concat([this.cached_translations?.source_language]).concat(this.cached_translations?.target_languages)
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


    private updateLocalCacheFromLocalBuild = async (): Promise<string | TranslationsConfiguration> => {
        return new Promise((resolve, reject) => {
            if (this.local_builded_translations !== undefined) {
                this.cached_translations = this.local_builded_translations;
                resolve(this.cached_translations);
            } else {
                reject('ErrorLoadFromBuild');
            }
        });
    };

    private updateLocalCacheFromOnline = async (): Promise<string | TranslationsConfiguration> => {
        return new Promise((resolve, reject) => {
            (async () => {
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
                    reject(e);
                }
            })()
        });
    }

    public async addKey(key: string, value: string = ''): Promise<string | unknown> {
        return new Promise((resolve, reject) => {
            (async () => {
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
            })()
        });
    }
}