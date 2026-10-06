// VOUCH Frontend bootstrap
document.addEventListener("DOMContentLoaded", async () => {
    const textEl = document.getElementById("ledger-text");
    try {
        const res = await fetch("/api/ledger/verify");
        const data = await res.json();
        if (data.status === "ok") {
            textEl.innerHTML = `<span style="color: #0d9488; font-weight: bold;">✔ Verified Intact:</span> ${data.count} cryptographic entries chained via SHA-256.`;
        } else {
            textEl.innerHTML = `<span style="color: #f43f5e; font-weight: bold;">✖ Integrity Alert:</span> Broken at sequence ${data.broken_seq}.`;
        }
    } catch (err) {
        textEl.textContent = "Unable to connect to verification API.";
    }
});
