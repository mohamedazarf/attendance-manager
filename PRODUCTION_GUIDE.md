# Guide de Déploiement en Production (IIS)

Ce document explique comment déployer l'application sur un serveur IIS local.

## 1. Backend (FastAPI)

### Prérequis

- Python 3.11+ installé sur le serveur.
- MongoDB installé et en cours d'exécution.

### Étapes

1.  **Environnement** :
    - Copiez `backend/.env.example` vers `backend/.env`.
    - Modifiez les valeurs dans `.env` (ex: `DEVICE_IP`, `MONGODB_URL`, `SECRET_KEY`).
2.  **Installation** :
    - Créez un environnement virtuel : `python -m venv venv`
    - Activez-le : `venv\Scripts\activate`
    - Installez les dépendances : `pip install -r requirements.txt`
3.  **Lancement** :
    - Utilisez `uvicorn` pour lancer le serveur :
      ```bash
      uvicorn app.main:app --host 0.0.0.0 --port 8000
      ```
    - _Note : Pour un lancement permanent, utilisez un gestionnaire de processus comme `NSSM` pour transformer cette commande en service Windows._

4.  **Configuration IIS (Reverse Proxy)** :
    - Installez **Application Request Routing (ARR)** et **URL Rewrite** sur IIS.
    - Dans IIS, créez un nouveau site ou utilisez le site par défaut.
    - Ajoutez une règle de réécriture pour rediriger les requêtes `/api/*` vers `http://localhost:8000/api/*`.

## 2. Frontend (React)

### Étapes

1.  **Configuration** :
    - Assurez-vous que `src/config/apiConfig.ts` pointe vers l'URL publique de votre API (ou laissez `/api` si vous utilisez le reverse proxy IIS).
2.  **Build** :
    - Dans le dossier `frontend/attendance-dashboard`, exécutez :
      ```bash
      npm run build
      ```
3.  **Déploiement IIS** :
    - Copiez le contenu du dossier `dist` (généré par le build) vers le dossier racine de votre site IIS (ex: `C:\inetpub\wwwroot\attendance`).
    - Le fichier `web.config` déjà présent dans `public/` (et donc dans `dist/`) gérera automatiquement les routes React (SPA).

## 3. Sécurité

- Assurez-vous que le `SECRET_KEY` dans le backend est fort et unique.
- Configurez le Pare-feu Windows pour autoriser le port du frontend (ex: 80) et du backend (ex: 8000) si nécessaire.
