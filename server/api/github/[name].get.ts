export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const [repo, readme] = await Promise.all([
    $fetch(`https://api.github.com/repos/shodiqarifin/${name}`, { headers }).catch(() => null),
    $fetch(`https://api.github.com/repos/shodiqarifin/${name}/readme`, { headers }).catch(() => null),
  ])

  return { repo, readme }
})
