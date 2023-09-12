import { exit } from 'process';
import minimist, { ParsedArgs } from 'minimist';
import fs from 'fs/promises';
import { FastI18nService } from './index';
const argv: ParsedArgs = minimist(process.argv.slice(2));

/**
 * Usage
 */
const usage = function () {
    console.log('Usage:');
    console.log('fasti18n -h | --help');
    console.log('fasti18n --project <project_id>');
};

/**
 * START
 */
if (argv.h || argv.help) {
    usage();
    exit(0);
}
if (!argv?.project) {
    usage();
    exit(1);
}

const project = argv['project'];

export const updateLocalTranslationBuild = async (project: string) => {
    const fastI18n = await FastI18nService.create({
        api_key: undefined,
        project_id: project,
        startup_policy: 'ONLINE',
        update_ttl: 5 * 60,
    });

    const cached_configuration = fastI18n.getCachedConfiguration();

    if (!cached_configuration) {
        throw new Error('Unable to retrieve the latest online configuration');
    }

    await fs.writeFile('.fasti18n.translations.json', JSON.stringify(cached_configuration)).catch(() => {
        throw new Error('Unable to write the latest online configuration');
    });

    exit(0);
}

updateLocalTranslationBuild(project);