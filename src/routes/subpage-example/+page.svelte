<script lang="ts">
	import { page } from "$app/state";

	import { Dialog } from "@capacitor/dialog";
	import { onMount } from "svelte";

	const showAlert = async (str: string) => {
		await Dialog.alert({
			title: "Message",
			message: str,
		});
	};

	async function tryFetch() {
		const res = await fetch(`http://192.168.1.81:4533/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
			// credentials: 'include' // abilita se Navidrome usa cookie-based sessions
		});

		if (!res.ok) {
			const text = await res.text();
			await showAlert(`HTTP ${res.status}: ${text}`);
			return { error: `HTTP ${res.status}: ${text}` };
		}

		const data = await res.json();

		if (data?.token != null) {
			await showAlert(`${data}`);
			return data;
		}

		await showAlert(`No token in response`);
		return { error: "No token in response" };
	}

	onMount(() => {
		showAlert("test, starting fetch").then(() => {
			tryFetch().then(() => {
				showAlert("fetch finished");
			});
		});
	});
</script>

<svelte:head>
	<title>Test page &#183; Bloom</title>
</svelte:head>

<h1 style="color:blue">Subpage!</h1>
