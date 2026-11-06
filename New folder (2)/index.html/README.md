# Lizon Mahmud — Ultra VFX Portfolio

A futuristic, cinematic personal portfolio with an interactive glossy black dragonfly that follows your cursor.

Built with HTML5, CSS3, vanilla JavaScript (ES6+), Canvas 2D / SVG, and an optional Python (Flask) contact backend. No heavy frameworks, no build step.

---

## 1. Project structure

```
lizon-portfolio/
├── index.html        Page structure, SEO metadata, all sections
├── style.css         Theme, glassmorphism, layout, responsive + reduced-motion rules
├── script.js         Loader, sound toggle, contact links, form, custom cursor
├── dragonfly.js      Interactive dragonfly (desktop) + lite companion (mobile)
├── animations.js     VFX: particles, cursor trail, reveals, tilt, magnetic buttons
├── config.js         Your contact details and settings (edit this)
├── assets/
│   ├── images/       Put optional images here
│   ├── sounds/       ambient.mp3 and click.mp3 (optional, see section 5)
│   └── models/       Reserved for future 3D models
├── backend/
│   ├── app.py        Optional Flask contact API
│   └── requirements.txt
└── README.md
```

---

## 2. Run locally in Visual Studio Code

### Step A — Install the prerequisites
1. Install **Visual Studio Code**: https://code.visualstudio.com
2. Install **Python 3.10+** (only needed for the optional backend): https://www.python.org/downloads
3. In VS Code, open the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`) and install **Live Server** by Ritwick Dey.

### Step B — Open the project
1. Unzip the `lizon-portfolio` folder.
2. In VS Code: **File → Open Folder…** and select `lizon-portfolio`.

### Step C — Run the static site (no backend needed)
1. In the Explorer, right-click `index.html`.
2. Choose **Open with Live Server**.
3. Your browser opens at `http://127.0.0.1:5500`.

The site works fully this way. The contact form opens the visitor's email app when no backend is configured.

### Step D — (Optional) Run the Flask backend
Open a second terminal in VS Code (**Terminal → New Terminal**):

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

The API runs at `http://127.0.0.1:5000/api/contact`.

Then open `config.js` and set:

```js
contactEndpoint: "http://127.0.0.1:5000/api/contact",
```

Reload the page. The contact form now posts to Flask.

To send real emails, set environment variables before `python app.py`:

| Variable | Example |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your.address@gmail.com` |
| `SMTP_PASSWORD` | a Gmail **App Password** (not your normal password) |
| `CONTACT_TO_EMAIL` | `lizonmahmud9@gmail.com` |
| `ALLOWED_ORIGINS` | `http://127.0.0.1:5500` |

Windows PowerShell example:
```powershell
$env:SMTP_HOST="smtp.gmail.com"; $env:SMTP_USER="you@gmail.com"; $env:SMTP_PASSWORD="app-password"; python app.py
```

Without SMTP variables, the backend logs each message to the terminal, so nothing is lost.

---

## 3. Customising

Edit `config.js` only. It holds the WhatsApp, email, and Facebook links, plus dragonfly tuning:

- `dragonfly.wingFlapSpeed` — wing beat rate
- `dragonfly.followSmoothing` — higher is snappier (0.05 to 0.15 works well)
- `dragonfly.enabled` — set to `false` to hide it

Edit the text in `index.html` to change the About section wording. Do not add qualifications or achievements unless they are true.

---

## 4. Features at a glance

- Premium loader, cinematic split-letter hero, floating 3D orbs with parallax
- Glassmorphism cards with pointer-following sheen and 3D tilt
- Magnetic buttons, custom glowing cursor with trail, mouse-following light
- Interactive dragonfly: real-time follow, flapping wings, banking body, hover bob, never blocks clicks or scrolling (`pointer-events: none`)
- Mobile and touch: lightweight autonomous companion instead of the cursor-follower
- Sound OFF by default, no autoplay, visible toggle and volume slider
- Responsive layout for desktop, laptop, tablet, Android, and iPhone
- `prefers-reduced-motion` respected; animations pause when the tab is hidden
- Canvas-only particles with a non-WebGL fallback background
- SEO metadata, Open Graph tags, semantic HTML, keyboard focus styles

---

## 5. Optional audio

Add your own royalty-free files to `assets/sounds/`:
- `ambient.mp3` — looping background track
- `click.mp3` — short interaction sound

Use only audio you have the rights to. If the files are missing, the sound button disables itself and shows "Unavailable" rather than breaking the page.

---

## 6. Deploy online for free

### Option 1 — Netlify Drop (fastest, no account setup needed beyond signup)
1. Go to https://app.netlify.com/drop
2. Drag the `lizon-portfolio` folder onto the page.
3. Netlify gives you a public URL such as `https://random-name.netlify.app`. You can rename it under **Site settings → Change site name**.

Note: Netlify hosts the static site. The Flask backend is not hosted there. Keep `contactEndpoint` empty in `config.js` for this option, so the form uses the email fallback.

### Option 2 — GitHub Pages
1. Create a free account at https://github.com and a new public repository, e.g. `lizon-portfolio`.
2. Upload all project files to the repository root (`index.html` must be at the top level).
3. Go to **Settings → Pages**, set **Source** to `Deploy from a branch`, choose `main` and `/ (root)`, and save.
4. Your site appears at `https://<your-username>.github.io/lizon-portfolio/` within a minute or two.

### Option 3 — Vercel
1. Sign in at https://vercel.com with GitHub.
2. Click **Add New → Project**, import the repository, and click **Deploy**. No build settings are needed.

### Optional: hosting the Flask backend for free
Render (https://render.com) offers a free web service tier for Python apps:
1. Push the `backend/` folder to a GitHub repository.
2. Create a **Web Service**, set the start command to `gunicorn app:app` (add `gunicorn` to `requirements.txt`), and add your SMTP variables under **Environment**.
3. Copy the service URL into `config.js` as `contactEndpoint`, ending with `/api/contact`.
4. Add your site's public URL to `ALLOWED_ORIGINS`.

Free tiers can sleep when idle, so the first request may be slow.

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| Dragonfly does not appear | Hidden on screens under 768px and on touch devices, which show the lite companion instead. Also hidden if reduced motion is enabled in your OS. |
| Contact form says "Could not send" | Check the backend is running and `ALLOWED_ORIGINS` includes your page URL. |
| Sound button shows "Unavailable" | Add `ambient.mp3` and `click.mp3` to `assets/sounds/`. |
| Page stuck on loader | Hard refresh with `Ctrl+F5`. A safety timer removes the loader after 3.5 seconds. |

---

## 8. Privacy

No analytics or tracking scripts are included. The contact form only sends what the visitor types, and only when they submit it.
