function configuredEmails(value = process.env.GROWTHOS_ALLOWED_EMAILS || '') {
  return new Set(
    value
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function accessForUser(user) {
  const allowedEmails = configuredEmails();
  const email = String(user?.email || '').trim().toLowerCase();

  if (allowedEmails.size === 0) {
    return {
      allowed: true,
      status: 200,
      email,
      allowlistEnabled: false
    };
  }

  if (!email || !allowedEmails.has(email)) {
    return {
      allowed: false,
      status: 403,
      error: 'This Google account is not approved for Gradient AI. Request access to be added to the workspace.'
    };
  }

  return { allowed: true, status: 200, email, allowlistEnabled: true };
}

module.exports = { accessForUser, configuredEmails };
