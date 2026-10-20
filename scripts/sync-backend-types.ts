/**
 * Copie les types partagés depuis le dépôt backend voisin (contrat d'intégration).
 *
 * Usage :
 *   npm run types:sync -- v1.1.0                       # version taguée (recommandé)
 *   npm run types:sync -- v1.1.0 ../chemin/abs-immo-backend
 *   npm run types:sync                                  # état actuel du dépôt (déconseillé)
 *
 * Avec un tag, les fichiers sont lus via `git show <tag>:<fichier>` : on copie exactement
 * la version publiée, même si la branche du backend a avancé depuis.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const tag = args.find((a) => /^v\d+\.\d+\.\d+$/.test(a))
const explicitDir = args.find((a) => a !== tag)
const candidates = [explicitDir, '../abs-immo-backend', '../abs_immo_backend'].filter(Boolean) as string[]
const backend = candidates.map((c) => resolve(process.cwd(), c)).find((dir) => existsSync(resolve(dir, 'src/types/contracts.ts')))

if (!backend) {
  console.error(`Dépôt backend introuvable (essayé : ${candidates.join(', ')}).`)
  process.exit(1)
}

const target = resolve(process.cwd(), 'src/types/backend')
for (const file of ['database.types.ts', 'contracts.ts', 'index.ts']) {
  if (tag) {
    const content = execFileSync('git', ['show', `${tag}:src/types/${file}`], { cwd: backend, maxBuffer: 10 * 1024 * 1024 })
    writeFileSync(resolve(target, file), content)
  } else {
    copyFileSync(resolve(backend, 'src/types', file), resolve(target, file))
  }
}
const version = /CONTRACT_VERSION = "([^"]+)"/.exec(readFileSync(resolve(target, 'contracts.ts'), 'utf8'))?.[1]
console.log(`Types copiés depuis ${backend}${tag ? ` (tag ${tag})` : ''} : contrat ${version ?? 'inconnu'}.`)
console.log('Étapes suivantes : npm run typecheck, puis mettre à jour CONTRACT_VERSION_EXPECTED et src/types/backend/README.md.')
