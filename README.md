# This is **Bloom**!

Bloom acts as a simple application for listening to tracks and radios from a hosted **[<img width="14" height="14" alt="Navidrome logo" src="https://avatars.githubusercontent.com/u/26692192?s=60&v=4"> Navidrome](https://github.com/navidrome/navidrome) music server**.<br>
It's programmed using common web technologies, [<img width="22.75" height="14" alt="Vite logo" alt="image" src="https://github.com/user-attachments/assets/1fd7f091-f26a-4023-ad05-14e322c65bac" /> Vite](https://vite.dev/guide/), and [<img width="14" height="14" alt="SvelteKit logo" src="https://github.com/user-attachments/assets/6742e7b1-6f0b-4940-8197-6fb0993e5db6" /> SvelteKit](https://svelte.dev/docs/kit/introduction).<br>
Built for mobile thanks to
<a href="https://capacitorjs.com/">
 <picture title="Capacitor">
    <source media="(prefers-color-scheme: dark)" width="75.83" height="14" srcset="https://github.com/user-attachments/assets/f9de554f-f288-4be6-baf8-56cac03af882" alt="Capacitor" />
    <source media="(prefers-color-scheme: light)" width="75.83" height="14" srcset="https://github.com/user-attachments/assets/837fb80b-b617-43c1-a7cf-43cb8058ed2a" alt="Capacitor" />
    <img src="https://github.com/user-attachments/assets/f9de554f-f288-4be6-baf8-56cac03af882" alt="Capacitor" />
  </picture>
</a>.

> [!NOTE]
> This project is still in very early stages and has slow progress.

## Setup

Not definitive, but recommended.

- Java 21 (e.g., for Codespaces, `sdk install java 21.0.8-ms` for the Microsoft version)
- Android 36
- iOS/Swift… unknown

When your dev environment is ready, you can `npm run compile-debug` for generating a debug APK.

> [!IMPORTANT]
> <details>
> <summary>Before building the app, you need to modify the audio player plugin because it's private.<br>Open here for more info.</summary>
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
