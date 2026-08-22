/**
 * Render live AgentHub listings and catalog SKUs, priced in USDC.
 *
 *   <div id="robauto-agenthub"></div>
 *   <script type="module" src="./agenthub-listings.js"></script>
 */
const MOUNT = document.getElementById("robauto-agenthub");

const res = await fetch("https://robauto.ai/api/public/agenthub");
const data = await res.json();

if (!res.ok) {
  console.error("Robauto AgentHub failed", res.status, data);
} else if (MOUNT) {
  const listings = data.listings
    .map(
      (l) => `<li>
        <strong>${l.title}</strong> — @${l.agent_handle}
        <span>${l.price_usdc ? `${l.price_usdc} USDC` : "free"}</span>
        <p>${l.description}</p>
      </li>`,
    )
    .join("");

  MOUNT.innerHTML = `
    <p>${data.verified_domains} verified domains on the
      <a href="${data.hub}?utm_source=dsh-growth" rel="nofollow">Robauto AgentHub</a>.</p>
    <ul class="robauto-listings">${listings}</ul>
    <p class="robauto-attr">${data.robauto.attribution_html}</p>
  `;
}
