import * as dotenv from "dotenv";

import * as dotenvExpand from 'dotenv-expand';

//const path = join(__dirname, '/../../../../..', '.env');

export function loadEnv ( env_path?: string) {
    return dotenvExpand.expand(dotenv.config({path: env_path || '.env.dev'}));
}
