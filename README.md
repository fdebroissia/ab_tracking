The purpose of this repository is to list variations of a single tracking framework for different personalisation tools.

The framework will:
- Create a ab_tracking object with utilities.
- Leverage various tool mecanisms to send 'view_experiment' events into the dataLayer.
- Create a function (track_event) that can be used to send custom events in the context of a test, along with contextual data.

The tools where it is deployed so far are:
- AB Tasty (https://www.abtasty.com/); we use the account javascript and an eventListener.
- Dynamic Yield (https://www.dynamicyield.com/); we use the analytics platform integration extension.
- Kameleoon (https://www.kameleoon.com/); COMING SOON
- VWO (https://vwo.com/); COMING SOON
- Optimizely (https://www.optimizely.com/); COMING SOON
