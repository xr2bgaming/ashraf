/* =========================================================
   CONFIG — Lizon Mahmud Portfolio
   Edit values here; every other module reads from this file.
   ========================================================= */
window.PORTFOLIO_CONFIG = Object.freeze({
  owner: {
    name: "Lizon Mahmud",
    email: "lizonmahmud9@gmail.com",
    whatsapp: "+8801879376797",          // digits only, used in wa.me link
    whatsappDisplay: "+880-1879-376797",
    facebookUrl: "https://www.facebook.com/share/1WdKKyG4BE/"
  },

  // Optional Flask backend endpoint for the contact form.
  // Leave empty ("") to run fully static (form falls back to mailto:).
  contactEndpoint: "",

  // Ambient sound file (place an MP3 at this path). Sound stays OFF until user toggles it.
  ambientSound: "assets/sounds/ambient.mp3",
  clickSound: "assets/sounds/click.mp3",

  dragonfly: {
    enabled: true,
    wingFlapSpeed: 28,      // rad/s baseline
    maxSpeed: 0.09,         // lerp ceiling per frame factor
    followSmoothing: 0.085  // higher = snappier
  }
});
