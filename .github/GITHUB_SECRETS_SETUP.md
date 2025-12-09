# Configuration des GitHub Secrets pour Portfolio Intelligence

## Variable d'environnement requise

Le projet nécessite la variable suivante pour fonctionner correctement dans GitHub Actions :

- **`PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL`** : URL de connexion à la base de données PostgreSQL

## Étapes pour ajouter le secret dans GitHub

### 1. Accéder aux paramètres du repository

1. Allez sur votre repository GitHub : https://github.com/aldopredator/WEB.portfolio-intelligence
2. Cliquez sur **Settings** (Paramètres) dans le menu en haut
3. Dans le menu latéral gauche, cliquez sur **Secrets and variables** → **Actions**

### 2. Ajouter le secret

1. Cliquez sur le bouton **New repository secret**
2. Dans le champ **Name**, entrez exactement : `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL`
3. Dans le champ **Secret**, collez votre URL de connexion PostgreSQL au format :
   ```
   postgresql://username:password@host:port/database?schema=public
   ```
   
   **Exemples :**
   - Production (Heroku) : `postgresql://user:pass@ec2-xxx.compute-1.amazonaws.com:5432/dbname`
   - Production (Railway) : `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`
   - Test (local) : `postgresql://postgres:postgres@localhost:5432/portfolio_test`

4. Cliquez sur **Add secret**

### 3. Options pour l'environnement de test

Vous avez plusieurs choix pour la base de données de test dans GitHub Actions :

#### Option A : Base de données de test dédiée (Recommandé)
Utilisez un service gratuit comme :
- **Supabase** (PostgreSQL gratuit) : https://supabase.com
- **Railway** (500h gratuit/mois) : https://railway.app
- **Neon** (PostgreSQL serverless gratuit) : https://neon.tech

#### Option B : Base de données temporaire dans CI
Le workflow crée automatiquement une base de données PostgreSQL locale pour les tests (voir ci-dessous).

## Vérification

Une fois le secret ajouté :

1. Le workflow GitHub Actions utilisera automatiquement ce secret
2. Vous pouvez déclencher un nouveau build en :
   - Poussant un nouveau commit
   - Ou allant dans **Actions** → Sélectionner le workflow → **Re-run jobs**

3. Les tests Playwright devraient maintenant passer sans erreur de connexion Prisma

## Sécurité

⚠️ **Important** :
- Ne committez JAMAIS l'URL de base de données dans le code
- N'utilisez jamais la base de données de production pour les tests
- Les secrets GitHub sont chiffrés et sécurisés
- Seuls les collaborateurs avec accès push peuvent voir/modifier les secrets

## Dépannage

Si vous voyez toujours l'erreur "Environment variable not found" :
1. Vérifiez que le nom du secret est exactement `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL`
2. Vérifiez que le workflow référence bien `secrets.PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL`
3. Re-déclenchez le workflow après avoir ajouté le secret

## Ressources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)
