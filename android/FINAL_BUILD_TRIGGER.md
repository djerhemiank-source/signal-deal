# Signal Deal — final Google Play bundle build

This marker intentionally triggers the Android release workflow after the final API 36 runtime smoke validation.

App code baseline: `MainActivity` with bounded startup network retry and `PAGE_READY` validation.

The generated release AAB must be signed with the existing Signal Deal upload key; no replacement upload key is permitted.
