The purpose of this repository is to list variations of a single tracking framework for different personalisation tools.

The framework will:
- Create a ab_tracking object with utilities.
- Leverage various tool mecanisms to send 'view_experiment' events into the dataLayer.
- Create a function (track_event) that can be used to send custom events in the context of a test, along with contextual data.

The tools where it is deployed so far are:
- AB Tasty (https://www.abtasty.com/); we use the account javascript and an eventListener.
- Dynamic Yield (https://www.dynamicyield.com/); we use the analytics platform integration extension.
- Kameleoon (https://www.kameleoon.com/); we use a custom integration.
- VWO (https://vwo.com/); we use the sitewide javascript and an eventListener (note: the sitewide js must be extended to a least 10kb - check with VWO teams).
- Optimizely (https://www.optimizely.com/); COMING SOON

Feel free to use it, but please credit Jellyfish / François de Broissia.
If you use it without support from analytics expert (Jellyfish or otherwise), you *will* have issues in time. The code (like any code) is not self-sufficient.
