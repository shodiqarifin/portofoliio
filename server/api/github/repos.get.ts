export default defineEventHandler(async () => {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  return $fetch('https://api.github.com/users/shodiqarifin/repos?sort=updated&per_page=30', { headers })
})
