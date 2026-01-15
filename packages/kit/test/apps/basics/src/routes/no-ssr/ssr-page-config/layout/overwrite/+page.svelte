import { browser } from '$app/environment';

if (browser) {
  // Now the server skips this line and stays alive
  document;
}