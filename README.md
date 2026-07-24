# Caleb's Music of the Week - End Icon Reset

This update keeps the working custom album-art button and adds a Spotify playback heartbeat watchdog.

Spotify occasionally stops a preview without sending a final paused event to the iframe API. When playback updates stop, the site now:

- resets the custom control to the play icon,
- stops the visualizer,
- marks the preview as finished, and
- keeps the button ready to restart from the beginning.

Deploy by replacing the corresponding files in the connected GitHub repository and committing the changes.
