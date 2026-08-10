document.addEventListener('DOMContentLoaded', () => {
  const fb = window.initFirebaseAuth?.();
  if (!fb) return;
  const auth = fb.auth();
  const db = fb.database();

  const toast = document.getElementById('toast');
  function showToast(msg){
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ---------- View switching ---------- */
  const views = {
    login: document.getElementById('view-login'),
    register: document.getElementById('view-register'),
    forgot: document.getElementById('view-forgot')
  };
  function show(view){
    Object.values(views).forEach(v => v && (v.style.display = 'none'));
    if (views[view]) views[view].style.display = 'block';
  }
  document.getElementById('show-register')?.addEventListener('click', (e) => { e.preventDefault(); show('register'); });
  document.getElementById('show-forgot')?.addEventListener('click', (e) => { e.preventDefault(); show('forgot'); });
  document.getElementById('back-to-login')?.addEventListener('click', (e) => { e.preventDefault(); show('login'); });
  document.getElementById('back-to-login-2')?.addEventListener('click', (e) => { e.preventDefault(); show('login'); });

  function afterLoginRedirect(){
    const params = new URLSearchParams(window.location.search);
    window.location.href = '/dashboard' + (params.toString() ? ('?' + params.toString()) : '');
  }

  /* ---------- Google login ---------- */
  document.getElementById('google-login')?.addEventListener('click', async () => {
    try{
      const provider = new fb.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      // Ensure a profile exists; link by email if one already exists under a username
      await db.ref('profiles/' + user.uid).transaction(existing => existing || {
        name: user.displayName || '',
        email: user.email,
        createdAt: Date.now()
      });
      afterLoginRedirect();
    } catch (err){
      showToast(err.message || 'Google sign-in failed.');
    }
  });

  /* ---------- Resolve username -> email via Realtime DB mapping ---------- */
  async function resolveEmail(identifier){
    if (identifier.includes('@')) return identifier;
    const snap = await db.ref('usernames/' + identifier.toLowerCase()).get();
    if (!snap.exists()) throw new Error('No account found for that username.');
    return snap.val().authEmail;
  }

  /* ---------- Email/username + password login ---------- */
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.classList.remove('show');
    try{
      const identifier = document.getElementById('login-id').value.trim();
      const password = document.getElementById('login-password').value;
      const email = await resolveEmail(identifier);
      await auth.signInWithEmailAndPassword(email, password);
      afterLoginRedirect();
    } catch (err){
      errEl.textContent = err.message || 'Login failed.';
      errEl.classList.add('show');
    }
  });

  /* ---------- Register ---------- */
  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('register-error');
    errEl.classList.remove('show');
    const username = document.getElementById('reg-username').value.trim().toLowerCase();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    try{
      const existing = await db.ref('usernames/' + username).get();
      if (existing.exists()) throw new Error('That username is already taken.');
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const uid = cred.user.uid;
      await db.ref('usernames/' + username).set({ uid, authEmail: email });
      await db.ref('profiles/' + uid).set({ username, email, createdAt: Date.now() });
      afterLoginRedirect();
    } catch (err){
      errEl.textContent = err.message || 'Registration failed.';
      errEl.classList.add('show');
    }
  });

  /* ---------- Forgot password ---------- */
  document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('forgot-error');
    errEl.classList.remove('show');
    try{
      const identifier = document.getElementById('forgot-id').value.trim();
      const email = await resolveEmail(identifier);
      await auth.sendPasswordResetEmail(email);
      showToast('Reset link sent to the registered email.');
      show('login');
    } catch (err){
      errEl.textContent = err.message || 'Could not send reset link.';
      errEl.classList.add('show');
    }
  });
});
