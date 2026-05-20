function renderDashboardShell({ title, subtitle, roleLabel }) {
  document.body.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <a class="brand" href="/">
          <img src="/image.png" alt="GeniDoc Hayat" />
          <span>
            <strong>GeniDoc Hayat</strong>
            <small>${roleLabel}</small>
          </span>
        </a>
        <button type="button" onclick="logout()">Déconnexion</button>
      </header>
      <section class="hero">
        <p>${roleLabel}</p>
        <h1>${title}</h1>
        <span>${subtitle}</span>
      </section>
      <section class="grid">
        <article><strong>Session</strong><span id="sessionUser">Chargement...</span></article>
        <article><strong>Rôle</strong><span id="sessionRole">Chargement...</span></article>
        <article><strong>Étape 2</strong><span>Auth + rôles validés</span></article>
      </section>
    </main>
  `;
}

function setDashboardUser(user) {
  document.getElementById("sessionUser").textContent =
    `${user.first_name} ${user.last_name} · ${user.email}`;
  document.getElementById("sessionRole").textContent = user.roles.join(", ");
}
