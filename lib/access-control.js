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

  if (!email) {
    return {
      allowed: false,
      status: 403,
      error: 'The signed-in account does not have a verified email address.'
    };
  }

  // Configure an allowlist only when the workspace is running as a private beta.
  if (allowedEmails.size > 0 && !allowedEmails.has(email)) {
    return {
      allowed: false,
      status: 403,
      error: 'This Google account is not approved for Gradient AI. Request access to be added to the workspace.'
    };
  }

  return { allowed: true, status: 200, email };
}

module.exports = { accessForUser, configuredEmails };
