const MODULE_ID = "guardiarines-ancestry";
const MIGRATION_SETTING = "did-auto-compendium-migration";

Hooks.once("init", () => {
	game.settings.register(MODULE_ID, MIGRATION_SETTING, {
		name: "Guardiarines compendium migration completed",
		hint: "Internal flag used to avoid rerunning migration every launch.",
		scope: "world",
		config: false,
		type: Boolean,
		default: false
	});
});

Hooks.once("ready", async () => {
	if (!game.user?.isGM) return;

	const alreadyMigrated = game.settings.get(MODULE_ID, MIGRATION_SETTING);
	if (alreadyMigrated) return;

	const packs = game.packs.filter((pack) => {
		const metadata = pack.metadata ?? {};
		const packageName = metadata.packageName ?? metadata.package;
		const packageType = metadata.packageType;
		return packageName === MODULE_ID && packageType === "module";
	});

	if (!packs.length) {
		await game.settings.set(MODULE_ID, MIGRATION_SETTING, true);
		return;
	}

	ui.notifications?.info("Guardiarines: iniciando migracion de compendios...");
	let hadErrors = false;

	for (const pack of packs) {
		try {
			await pack.migrate();
			console.log(`${MODULE_ID} | Migrado: ${pack.collection}`);
		} catch (error) {
			hadErrors = true;
			console.error(`${MODULE_ID} | Error migrando ${pack.collection}`, error);
			ui.notifications?.error(`Guardiarines: fallo al migrar ${pack.metadata?.label ?? pack.collection}`);
		}
	}

	if (hadErrors) {
		ui.notifications?.warn("Guardiarines: algunos compendios fallaron al migrar. Se reintentara al volver a cargar.");
		return;
	}

	await game.settings.set(MODULE_ID, MIGRATION_SETTING, true);
	ui.notifications?.info("Guardiarines: migracion de compendios completada.");
});
