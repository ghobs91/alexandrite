<Modal bind:visible {title}>
	<div class="modal-body">
		<slot />
		<br />
		<form on:submit|preventDefault={submit}>
			<TextInput bind:value={reason} autofocus>Reason</TextInput>
		</form>
	</div>
	<div class="modal-footer">
		<button on:click={() => (visible = false)} class="tertiary">Cancel</button>
		<BusyButton on:click={submit} cl="danger" {busy}>Submit</BusyButton>
	</div>
</Modal>

<script lang="ts">
	import { Modal, TextInput } from 'sheodox-ui';
	import { createEventDispatcher } from 'svelte';
	import BusyButton from './BusyButton.svelte';

	export let visible: boolean;
	export let busy: boolean;
	export let title = 'Report';
	let reason = '';

	const dispatch = createEventDispatcher<{ reason: string }>();
	const submit = () => dispatch('reason', reason);
</script>
