<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	type MoldRow = {
		id: string;
		volume_ml: number | null;
		created_at: string;
		error?: string | null;
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
	let totalVolumeMl = $derived(
		molds.reduce((sum, mold) => (isValidVolume(mold) ? sum + (mold.volume_ml ?? 0) : sum), 0)
	);
	let totalGrams = $derived(totalVolumeMl * 2);
	let results = $derived<Results>(calculateResults(totalGrams));

	function isValidVolume(mold: MoldRow): boolean {
		return !mold.error && typeof mold.volume_ml === 'number' && !Number.isNaN(mold.volume_ml);
	}

	function createEmptyMold(): MoldRow {
		return {
			id: crypto.randomUUID(),
			volume_ml: null,
			created_at: new Date().toISOString(),
			error: null
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

		// limit to 3 decimal places
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

	function addMold(focusLast = true) {
		molds = [...molds, createEmptyMold()];
		if (focusLast) {
			queueMicrotask(() => {
				const input = document.querySelector<HTMLInputElement>(
					'[data-mold-input="last"]'
				);
				input?.focus();
			});
		}
	}

	function onVolumeInput(id: string, raw: string, isLast: boolean) {
		molds = molds.map((mold, index) => {
			if (mold.id !== id) return mold;
			const { value, error } = normalizeAndValidateVolume(raw);
			return { ...mold, volume_ml: value, error };
		});

		// auto-add row when last becomes valid
		if (isLast) {
			const last = molds[molds.length - 1];
			if (last && isValidVolume(last)) {
				addMold(false);
			}
		}

		saveState();
	}

	function deleteMold(id: string) {
		undoStack = molds;
		showUndo = true;
		molds = molds.filter((m) => m.id !== id);
		if (molds.length === 0) addMold(false);
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
		addMold(false);
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
		const toSave = molds.filter((m) => m.volume_ml !== null);
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ molds: toSave, last_updated: new Date().toISOString() })
		);
	}

	function loadState() {
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			molds = [createEmptyMold()];
			return;
		}
		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed.molds) && parsed.molds.length > 0) {
				molds = parsed.molds.map((m: MoldRow) => ({ ...m, error: null }));
			} else {
				molds = [createEmptyMold()];
			}
		} catch {
			molds = [createEmptyMold()];
		}
	}

	onMount(() => {
		loadState();
		if (molds.length === 0) addMold(false);
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

		<section aria-label="Mold list" class="mb-4">
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
			<div class="space-y-2">
				{#if molds.length === 0}
					<p class="text-xs text-slate-400">Add a mold to begin</p>
				{/if}
				{#each molds as mold, index (mold.id)}
					<div
						class="flex items-start gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm transition-all duration-150"
					>
						<div class="flex-1">
							<label
								class="block text-[11px] uppercase tracking-wide text-slate-500 mb-1"
								for={`mold-${index + 1}`}
							>
								Mold {index + 1}
							</label>
							<input
								data-mold-input={index === molds.length - 1 ? 'last' : 'row'}
								inputmode="decimal"
								type="text"
								id={`mold-${index + 1}`}
								placeholder="Volume (ml)"
								class={`w-full rounded-lg border px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${
									mold.error ? 'border-red-400' : 'border-slate-200'
								}`}
								aria-label={`Mold ${index + 1} volume in milliliters`}
								value={mold.volume_ml ?? ''}
								oninput={(e) => onVolumeInput(mold.id, e.currentTarget.value, index === molds.length - 1)}
							/>
							{#if mold.error}
								<p class="mt-1 text-xs text-red-500">{mold.error}</p>
							{/if}
						</div>
						<button
							type="button"
							class="mt-5 shrink-0 rounded-full p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400"
							aria-label={`Delete mold ${index + 1}`}
							onclick={() => deleteMold(mold.id)}
						>
							<span class="i-lucide-trash h-4 w-4" aria-hidden="true">🗑</span>
						</button>
					</div>
				{/each}
			</div>
			<button
				type="button"
				class="mt-3 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 flex items-center justify-center gap-2 hover:border-sky-400 hover:text-sky-600 bg-white/60"
				onclick={() => addMold()}
			>
				<span class="text-lg leading-none">+</span>
				<span> Add Mold</span>
			</button>
		</section>

		<section
			aria-label="Results in grams"
			class="mt-4 rounded-xl bg-white shadow-sm border border-slate-100 px-4 py-3"
		>
			<div class="flex items-center justify-between mb-2">
				<h2 class="text-base font-semibold text-slate-800">Results (g)</h2>
				<span class="text-[11px] uppercase tracking-wide text-slate-400">
					Live update
				</span>
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
