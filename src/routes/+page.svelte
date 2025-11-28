<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	type MoldRow = {
		id: string;
		volume_ml: number;
		created_at: string;
	};

	type Results = {
		water: number;
		bond: number;
		white_cement: number;
		putty: number;
	};

	const STORAGE_KEY = 'poly_concrete_state_v1';
	const MAX_VOLUME_PER_MOLD = 100000;

	let molds = $state<MoldRow[]>([]);
	let undoStack = $state<MoldRow[] | null>(null);
	let showUndo = $state(false);
	let inputValue = $state('');
	let inputError = $state<string | null>(null);
	let totalVolumeMl = $derived(molds.reduce((sum, mold) => sum + mold.volume_ml, 0));
	let totalGrams = $derived(totalVolumeMl * 2);
	let results = $derived<Results>(calculateResults(totalGrams));

	function createEmptyMold(): MoldRow {
		return {
			id: crypto.randomUUID(),
			volume_ml: 0,
			created_at: new Date().toISOString()
		};
	}

	function normalizeAndValidateVolume(raw: string): { value: number | null; error: string | null } {
		if (!raw.trim()) return { value: null, error: null };

		let parsed = Number(raw.replace(',', '.'));
		if (Number.isNaN(parsed)) {
			return { value: null, error: 'Please enter a valid number' };
		}

		if (parsed < 0) {
			parsed = 0;
			return { value: parsed, error: 'Negative values are not allowed; set to 0' };
		}

		if (parsed > MAX_VOLUME_PER_MOLD) {
			return {
				value: MAX_VOLUME_PER_MOLD,
				error: `Max allowed is ${MAX_VOLUME_PER_MOLD.toLocaleString()} ml`
			};
		}

		parsed = Math.round(parsed * 1000) / 1000;
		return { value: parsed, error: null };
	}

	function calculateResults(total: number): Results {
		if (total <= 0) {
			return { water: 0, bond: 0, white_cement: 0, putty: 0 };
		}
		const PERC = {
			water: 0.2,
			bond: 0.05,
			white_cement: 0.15,
			putty: 0.6
		} as const;

		let water = Math.round(total * PERC.water);
		let bond = Math.round(total * PERC.bond);
		let white_cement = Math.round(total * PERC.white_cement);
		let putty = Math.round(total * PERC.putty);

		let sum = water + bond + white_cement + putty;
		if (sum !== total) {
			putty += total - sum;
		}

		return { water, bond, white_cement, putty };
	}

	function addMold() {
		const { value, error } = normalizeAndValidateVolume(inputValue);
		inputError = error;
		if (value === null || error) return;
		molds = [...molds, { id: crypto.randomUUID(), volume_ml: value, created_at: new Date().toISOString() }];
		inputValue = '';
		inputError = null;
		saveState();
	}

	function deleteMold(id: string) {
		undoStack = molds;
		showUndo = true;
		molds = molds.filter((m) => m.id !== id);
		saveState();
		setTimeout(() => {
			showUndo = false;
			undoStack = null;
		}, 3500);
	}

	function clearAll() {
		undoStack = molds;
		showUndo = true;
		molds = [];
		inputValue = '';
		inputError = null;
		localStorage.removeItem(STORAGE_KEY);
		setTimeout(() => {
			showUndo = false;
			undoStack = null;
		}, 3500);
	}

	function undoDelete() {
		if (!undoStack) return;
		molds = undoStack;
		undoStack = null;
		showUndo = false;
		saveState();
	}

	function saveState() {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ molds, last_updated: new Date().toISOString() })
		);
	}

	function loadState() {
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			molds = [];
			return;
		}
		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed.molds) && parsed.molds.length > 0) {
				molds = parsed.molds;
			} else {
				molds = [];
			}
		} catch {
			molds = [];
		}
	}

	onMount(() => {
		loadState();
		if (molds.length === 0) molds = [];

		// Try to prevent the mobile screen from turning off while the user is actively using the calculator
		if (typeof navigator !== 'undefined') {
			const anyNavigator = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<unknown> } };
			if (anyNavigator.wakeLock?.request) {
				anyNavigator.wakeLock
					.request('screen')
					.catch(() => {
						/* ignore */
					});
			}
		}
	});

	function formatNumber(n: number): string {
		return n.toLocaleString('en-US');
	}
</script>

<main class="min-h-screen bg-slate-50 text-slate-900 flex justify-center px-4 py-6">
	<div class="w-full max-w-sm">
		<header class="mb-6 text-center">
			<h1 class="text-2xl font-semibold tracking-tight">Polymer Concrete Calculator</h1>
			<p class="text-sm text-slate-500 mt-1">Enter mold volumes in milliliters</p>
		</header>

		<section
			aria-label="Total volume summary"
			class="mb-4 rounded-xl bg-white shadow-sm border border-slate-100 px-4 py-3 flex items-center justify-between"
		>
			<div class="text-sm font-medium text-slate-600">Total Volume</div>
			<div class="text-lg font-semibold text-slate-900">
				{#if totalVolumeMl > 0}
					{formatNumber(totalVolumeMl)} ml
				{:else}
					0 ml
				{/if}
			</div>
		</section>

		<section aria-label="Results in grams" class="mb-4 rounded-xl bg-white shadow-sm border border-slate-100 px-4 py-3">
			<div class="flex items-center justify-between mb-2">
				<h2 class="text-base font-semibold text-slate-800">Results (g)</h2>
				<span class="text-[11px] uppercase tracking-wide text-slate-400">Live update</span>
			</div>
			{#if totalGrams <= 0}
				<p class="text-xs text-slate-400">Add a mold to begin</p>
			{:else}
				<dl class="grid grid-cols-2 gap-3 text-sm">
					<div class="rounded-lg bg-sky-50 px-3 py-2">
						<dt class="text-xs text-sky-700">Water</dt>
						<dd class="text-base font-semibold text-sky-900">
							{formatNumber(results.water)}
							<span class="text-xs font-normal text-sky-700 ml-1">g</span>
						</dd>
					</div>
					<div class="rounded-lg bg-amber-50 px-3 py-2">
						<dt class="text-xs text-amber-700">Bond</dt>
						<dd class="text-base font-semibold text-amber-900">
							{formatNumber(results.bond)}
							<span class="text-xs font-normal text-amber-700 ml-1">g</span>
						</dd>
					</div>
					<div class="rounded-lg bg-slate-50 px-3 py-2">
						<dt class="text-xs text-slate-700">White Cement</dt>
						<dd class="text-base font-semibold text-slate-900">
							{formatNumber(results.white_cement)}
							<span class="text-xs font-normal text-slate-700 ml-1">g</span>
						</dd>
					</div>
					<div class="rounded-lg bg-emerald-50 px-3 py-2">
						<dt class="text-xs text-emerald-700">Putty</dt>
						<dd class="text-base font-semibold text-emerald-900">
							{formatNumber(results.putty)}
							<span class="text-xs font-normal text-emerald-700 ml-1">g</span>
						</dd>
					</div>
				</dl>
				<p class="mt-3 text-xs text-slate-500 text-right">
					Total grams: <span class="font-semibold">{formatNumber(totalGrams)}</span>
					<span class="ml-1">g</span>
				</p>
			{/if}
		</section>

		<section aria-label="Mold list" class="mt-3">
			<div class="flex items-center justify-between mb-2">
				<h2 class="text-base font-semibold text-slate-800">Mold List</h2>
				<button
					type="button"
					class="text-xs text-slate-500 hover:text-slate-700 underline"
					onclick={clearAll}
				>
					Clear All
				</button>
			</div>
			<div class="mb-2">
				<label
					for="mold-input"
					class="block text-[11px] uppercase tracking-wide text-slate-500 mb-1"
				>
					New mold volume (ml)
				</label>
				<div class="flex gap-2">
					<input
						id="mold-input"
						inputmode="decimal"
						type="text"
						placeholder="e.g. 320"
						class={`flex-1 rounded-lg border px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${
							inputError ? 'border-red-400' : 'border-slate-200'
						}`}
						aria-label="Mold volume in milliliters"
						bind:value={inputValue}
					/>
					<button
						type="button"
						class="shrink-0 rounded-lg bg-sky-600 text-white px-3 py-2 text-sm font-medium hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-600"
						onclick={addMold}
					>
						+
					</button>
				</div>
				{#if inputError}
					<p class="mt-1 text-xs text-red-500">{inputError}</p>
				{/if}
			</div>
			<div class="min-h-[1.5rem]">
				{#if molds.length === 0}
					<p class="text-xs text-slate-400">Add a mold to begin</p>
				{:else}
					<div class="flex flex-wrap gap-2">
						{#each molds as mold (mold.id)}
							<span class="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs text-slate-700">
								{formatNumber(mold.volume_ml)} ml
								<button
									type="button"
									class="ml-1 text-slate-400 hover:text-red-500 focus:outline-none"
									aria-label={`Delete mold of ${mold.volume_ml} milliliters`}
									onclick={() => deleteMold(mold.id)}
								>
									×
								</button>
							</span>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		{#if showUndo}
			<div
				role="status"
				class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm rounded-full bg-slate-900 text-white px-4 py-2 flex items-center justify-between shadow-lg text-sm"
			>
				<span>Change applied</span>
				<button
					type="button"
					class="font-semibold underline underline-offset-2"
					onclick={undoDelete}
				>
					Undo
				</button>
			</div>
		{/if}
	</div>
</main>
