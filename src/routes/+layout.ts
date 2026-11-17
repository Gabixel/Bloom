import { cconsole } from "../lib/logger.svelte";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

cconsole.log("Hello from layout.ts");

gsap.ticker.lagSmoothing(false);

gsap.registerPlugin(Draggable);
