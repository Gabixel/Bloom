# Bloom

A music player web app interface for [Navidrome](https://github.com/navidrome/navidrome) servers, with [SvelteKit](https://svelte.dev/docs/kit/introduction).

Made for mobile phones thanks to [Capacitor](https://capacitorjs.com/).

> [!NOTE]
> This project is still in very early stages and has slow progress.

## (Personal) Setup

- Java 21 (e.g., for Codespaces, `sdk install java 21.0.8-ms` for the Microsoft version)
- Android 36
- iOS/Swift... unknown, for now

When your dev environment is ready, you can `npm run compile-debug` for generating a debug APK.

## A note about AI

My current philosophy is: "I'd rather die than learn Java." As a result, I currently have no way to personally develop a native Capacitor plugin for Android (let alone iOS: Swift is arguably even more complicated) to play music.

There aren't many plugins on the market. The few that exist seem broken or buggy, unmaintained, and out of date; the rest are subscription-based.

For now, the solution has been to run several sessions with Copilot to create a proprietary plugin using AI, even though I'm against the "vibe coding" approach. Therefore, the plugin will remain private because I refuse to publish sloppy AI-generated code (it's not like what I develop myself is any better :P). If you don't approve this, well… then learn Java and come back with a human-written working plugin!

I may reconsider this in the distant future, just maybe. Thanks for your understanding.
