const settings = $state({
	dimmed_lights: {
		enabled: false,
		value: 0.9,
		RANGE_MIN: 0.4 as const,
		RANGE_MAX: 0.9 as const,
		RANGE_STEP: 0.1 as const,
	},
});

export const settingsData = {
	getSetting(name: keyof typeof settings) {
		return settings[name];
	},
};

// TODO: store settings
