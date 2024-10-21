import {
	complexModifications,
	ModificationParameters,
} from "./config/complex-modifications.ts";
import { RuleBuilder } from "./config/rule.ts";
import { KarabinerConfig, Rule } from "./karabiner/karabiner-config.ts";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

export const writeContext = {
	karabinerConfigDir() {
		return path.join(
			os.homedir(),
			".config/karabiner",
		);
	},
	karabinerConfigFile() {
		return path.join(
			this.karabinerConfigDir(),
			"karabiner.json",
		);
	},
	readKarabinerConfig(karabinerJsonPath?: string) {
		const content = JSON.parse(
			fs.readFileSync(
				karabinerJsonPath ?? this.karabinerConfigFile(),
			).toString(),
		);
		return content;
	},
	writeKarabinerConfig(json: any, karabinerJsonPath?: string) {
		return fs.writeFileSync(
			karabinerJsonPath ?? this.karabinerConfigFile(),
			json,
		);
	},
	readJson(filePath: string) {
		return JSON.parse(fs.readFileSync(filePath).toString());
	},
	exit(code = 0) {
		process.exit(code);
	},
};

export interface WriteTarget {
	name: string;
	dryRun?: boolean;
	karabinerJsonPath?: string;
}

/**
 * Write complex_modifications rules to a profile inside ~/.config/karabiner/karabiner.json
 *
 * @param writeTarget The profile name or a WriteTarget describing the profile and where to write the output.
 *                    Use '--dry-run' to print the config json into console.
 * @param rules       The complex_modifications rules
 * @param parameters  Extra complex_modifications parameters
 *
 * @see https://karabiner-elements.pqrs.org/docs/json/root-data-structure/
 */
export function writeToProfile(
	writeTarget: "--dry-run" | string | WriteTarget,
	rules: Array<Rule | RuleBuilder>,
	parameters: ModificationParameters = {},
) {
	if (typeof writeTarget === "string") {
		writeTarget = { name: writeTarget, dryRun: writeTarget === "--dry-run" };
	}
	const { name, dryRun } = writeTarget;
	const jsonPath = writeTarget.karabinerJsonPath ??
		writeContext.karabinerConfigFile();

	const config: KarabinerConfig = dryRun
		? { profiles: [{ name, complex_modifications: { rules: [] } }] }
		: writeContext.readKarabinerConfig(jsonPath);

	const profile = config?.profiles.find((v) => v.name === name);
	if (!profile) {
		exitWithError(`⚠️ Profile ${name} not found in ${jsonPath}.\n
ℹ️ Please check the profile name in the Karabiner-Elements UI and 
    - Update the profile name at writeToProfile()
    - Create a new profile if needed
 `);
	}

	try {
		profile.complex_modifications = complexModifications(rules, parameters);
	} catch (e) {
		exitWithError(e);
	}

	const json = JSON.stringify(config, null, 2);

	if (dryRun) {
		console.info(json);
		return;
	}

	writeContext.writeKarabinerConfig(json, jsonPath); //.catch(exitWithError);

	console.log(`✓ Profile ${name} updated.`);
}

function exitWithError(err: any): never {
	if (err) {
		if (typeof err === "string") {
			console.error(err);
		} else {
			console.error((err as Error).message || err);
		}
	}
	return writeContext.exit(1);
}
