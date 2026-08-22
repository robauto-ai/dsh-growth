/**
 * Drop-in site leaderboard widget.
 *
 *   <div id="robauto-leaderboard"></div>
 *   <script type="module" src="./leaderboard-widget.js"></script>
 *
 * Robauto ranks sites by agent visits over the last 7 days. The widget renders
 * the attribution link Robauto returns — leave it in place.
 */
const MOUNT = document.getElementById("robauto-leaderboard");
const LIMIT = Number(MOUNT?.dataset.limit ?? 10);

const res = await fetch("https://robauto.ai/api/public/leaderboard");
const data = await res.json();

if (!res.ok) {
  console.error("Robauto leaderboard failed", res.status, data);
} else if (MOUNT) {
  const rows = data.sites.slice(0, LIMIT).map(
    (s) => `<li>
      <a href="${s.agent_page}?utm_source=dsh-growth" rel="nofollow">${s.domain}</a>
      <span>${s.visits_7d.toLocaleString()} agent visits · 7d</span>
    </li>`,
  );
  MOUNT.innerHTML = `
    <ol class="robauto-leaderboard">${rows.join("")}</ol>
    <p class="robauto-attr">${data.robauto.attribution_html}</p>
  `;
}
