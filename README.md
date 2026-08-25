<h1 align="center">🌻 This is <strong>Bloom</strong>! ☀</h1>

<div align=center><picture title="Bloom" width="250">
	<source media="(prefers-color-scheme: dark) and (max-width: 700px)" srcset="assets/bloom-logo.png" alt="Bloom logo" width="250" height="250" />
	<source media="(prefers-color-scheme: dark)" srcset="assets/bloom-logo.png" alt="Bloom logo" width="0" height="0" />
	<source media="(prefers-color-scheme: light) and (max-width: 700px)" srcset="assets/bloom-logo.png" alt="Bloom logo" width="250" height="250" />
	<source media="(prefers-color-scheme: light)" srcset="assets/bloom-logo.png" alt="Bloom logo" width="0" height="0" />
	<img src="assets/bloom-logo.png" alt="Bloom logo" width="0" height="0" />
</picture></div><picture title="Bloom" width="250">
	<source media="(prefers-color-scheme: dark) and (max-width: 700px)" srcset="assets/bloom-logo.png" alt="Bloom logo" width="0" />
	<source media="(prefers-color-scheme: dark)" srcset="assets/bloom-logo.png" alt="Bloom logo" width="250" />
	<source media="(prefers-color-scheme: light) and (max-width: 700px)" srcset="assets/bloom-logo.png" alt="Bloom logo" width="0" />
	<source media="(prefers-color-scheme: light)" srcset="assets/bloom-logo.png" alt="Bloom logo" width="250" />
	<img src="assets/bloom-logo.png" alt="Bloom logo" width="250" align="right" />
</picture>

**Bloom** acts as a simple application for listening to tracks and radios from a hosted **[<img width="14" height="14" alt="Navidrome logo" src="https://avatars.githubusercontent.com/u/26692192?s=60&v=4">&shy;&nbsp;Navidrome](https://github.com/navidrome/navidrome) music server**.<br>
It's programmed using common web technologies, **[<picture title="Vite" ><source media="(prefers-color-scheme: dark)" width="22.82" height="14" srcset="https://github.com/user-attachments/assets/5684bc34-b885-4673-aeec-ab7abafee4a7" alt="Vite" /> <source media="(prefers-color-scheme: light)" width="22.82" height="14" srcset="https://github.com/user-attachments/assets/a5279f54-d088-4282-b986-50da9b65cb7c" alt="Vite" /> <img src="https://github.com/user-attachments/assets/5684bc34-b885-4673-aeec-ab7abafee4a7" width="22.82" height="14" alt="Vite" /></picture>&shy;&nbsp;Vite](https://vite.dev/guide/)**, and **[<img width="14" height="14" alt="SvelteKit logo" src="https://github.com/user-attachments/assets/6742e7b1-6f0b-4940-8197-6fb0993e5db6" />&shy;&nbsp;SvelteKit](https://svelte.dev/docs/kit/introduction)**.<br>
Built for mobile thanks to **[<img width="14" height="14" alt="Capacitor" src="https://github.com/user-attachments/assets/1fd81e61-adfc-4ea9-be9c-4bd2d2d138a8" />&shy;&nbsp;Capacitor](https://capacitorjs.com/)**.

<table>
<tr></tr>
<tr><td>

> [!NOTE]
> This project is still in very early stages and has slow progress.

</td></tr>
</table>

<div align="right"><small><br clear="right"></small></div>

<h2>✿ Setup</h2>

Not definitive, but recommended.

- **Android**
  - Java 21<br>
    (e.g., for Codespaces, `sdk install java 21.0.8-ms` for the Microsoft version)
  - Target Android version: 36
- **~~iOS/Swift~~** (unsupported, for now)

When your dev environment is ready, you can `npm run compile-debug` for generating a debug APK.

> [!IMPORTANT]
> <details>
> <summary>Before building the app, you need to change the audio player plugin (with something else) because it's <strong>private</strong>.<br><sup>(Open here for more info)</sup></summary>
> 
> ---
> 
> My current philosophy is: "I'd rather die than learn Java." As a result, I currently have no way to personally develop a native Capacitor plugin for Android (let alone iOS: Swift is arguably even more complicated) to play music.
> 
> There aren't many plugins on the market. The few that exist seem broken or buggy, unmaintained, and out of date; the rest are subscription-based.
> 
> For now, the solution has been to run several sessions with AI to create a proprietary plugin, even though I'm against the whole "vibe coding" approach. Therefore, the plugin will remain private because I refuse to publish sloppy AI-generated code (it's not like what I develop myself is any better :P). If you don't approve this, well… then learn Java and come back with a human-written working plugin!
> 
> I may reconsider this in the distant future, just maybe. Thanks for your understanding.
> </details>
