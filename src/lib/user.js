export function resolveUserId(user) {
  return user?.id || user?.username || user?.email;
}

export function mapUserRow(row) {
  if (!row) return null;

  const firstName = row.first_name ?? null;
  const lastName = row.last_name ?? null;
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();

  return {
    id: row.id,
    // Display name: prefer the chosen username, fall back to the full name.
    name: row.username || fullName || row.email,
    username: row.username ?? null,
    firstName,
    lastName,
    email: row.email,
    gender: row.gender ?? null,
    dob: row.dob ?? null,
    country: row.country ?? null,
    avatar: row.avatar ?? null,
    activeTitle: row.active_title ?? null,
    activeSnakeColor: row.active_snake_color ?? null,
  };
}
