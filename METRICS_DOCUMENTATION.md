# Documentation - Taux de Présence et d'Absentéisme

## Overview

Ce module implémente le calcul automatique des taux de présence et d'absentéisme pour chaque employé sur une période donnée.

## Architecture

### 1. **Service Backend** (`attendance_metrics_service.py`)

Le service `AttendanceMetricsService` fournit les fonctions de calcul :

```python
class AttendanceMetricsService:
    - get_working_days_in_month(year, month) → int
    - get_employee_attendance_status(employee_id, year, month) → Dict
    - get_all_employees_metrics(year, month) → List[Dict]
    - get_employee_metrics_date_range(employee_id, start_date, end_date) → Dict
```

### 2. **API Endpoints** (Ajoutés à `app/api/v1/attendance.py`)

#### a) Métriques d'un employé pour un mois
```
GET /api/v1/attendance/metrics/employee/{employee_id}?year=2024&month=1
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "employee_id": 1,
    "year": 2024,
    "month": 1,
    "period": "2024-01",
    "total_working_days": 23,
    "days_present": 21,
    "days_absent": 2,
    "presence_rate": 91.30,
    "absence_rate": 8.70,
    "attendance_count": 42
  }
}
```

#### b) Métriques de tous les employés
```
GET /api/v1/attendance/metrics/all-employees?year=2024&month=1
```

**Response:**
```json
{
  "status": "success",
  "total_employees": 53,
  "year": 2024,
  "month": 1,
  "data": [
    {
      "employee_id": 1,
      "employee_name": "Ahmed Ben Salah",
      "presence_rate": 91.30,
      "absence_rate": 8.70,
      ...
    },
    ...
  ]
}
```

#### c) Métriques sur une plage de dates personnalisée
```
GET /api/v1/attendance/metrics/employee/{employee_id}/range?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "employee_id": 1,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "total_working_days": 23,
    "days_present": 21,
    "days_absent": 2,
    "presence_rate": 91.30,
    "absence_rate": 8.70,
    "attendance_count": 42
  }
}
```

## Logique de Calcul

### Jours Ouvrés
- Compte uniquement les jours de **lundi à vendredi**
- Exclut les weekends (samedi, dimanche)
- Les jours fériés ne sont **pas encore gérés** (À ajouter si nécessaire)

### Présence
- Un jour est compté comme "présent" s'il y a **au moins 1 pointage** enregistré
- La présence exacte (heures travaillées) n'est pas prise en compte pour ce calcul basique

### Formules
```
Taux de Présence = (Jours Présents / Jours Ouvrés) × 100%
Taux d'Absentéisme = (Jours Absents / Jours Ouvrés) × 100%

Où:
- Jours Absents = Jours Ouvrés - Jours Présents
- Jours Présents = Jours avec au moins 1 pointage
```

## Frontend Component

### AttendanceMetrics.tsx

Composant React affichant les métriques dans une interface Chakra UI :

```typescript
<AttendanceMetrics />
```

**Features:**
- ✅ Filtres par année et mois
- ✅ Tableau avec tous les employés
- ✅ Barres de progression pour les taux
- ✅ Badges de statut (Excellent/Bon/À Améliorer)
- ✅ Statistiques récapitulatives (moyenne, total)
- ✅ Responsive design

**Placement:** 
- Dashboard principal (`src/pages/Dashboard.tsx`)
- Peut être réutilisé dans d'autres pages

## Tests

Tests unitaires fournis dans `test_attendance_metrics_service.py`:

```bash
pytest tests/test_attendance_metrics_service.py
```

Tests couverts:
- ✅ Calcul correct des jours ouvrés par mois
- ✅ Structure de la réponse des métriques
- ✅ Calcul des taux (présence + absentéisme = 100%)
- ✅ Plage de dates personnalisée

## Utilisation

### Via l'API directement

```bash
# Obtenir métriques du mois courant pour l'employé 1
curl "http://localhost:8000/api/v1/attendance/metrics/employee/1?year=2024&month=2"

# Obtenir tous les employés du mois
curl "http://localhost:8000/api/v1/attendance/metrics/all-employees?year=2024&month=2"

# Plage personnalisée (janvier 2024)
curl "http://localhost:8000/api/v1/attendance/metrics/employee/1/range?start_date=2024-01-01&end_date=2024-01-31"
```

### Depuis le Dashboard
1. Aller sur le Dashboard
2. Le tableau "Taux de Présence et d'Absentéisme" s'affiche automatiquement
3. Sélectionner année et mois dans les filtres
4. Cliquer "Actualiser"

## Améliorations Futures

### Court Terme (À ajouter rapidement)
1. **Gestion des jours fériés** - Exclure de la limite des jours ouvrés
2. **Congés validés** - Différencier entre absence non justifiée et congés
3. **Détails journaliers** - Afficher heures réelles travaillées par jour
4. **Export PDF/Excel** - Générer rapports

### Moyen Terme
1. **Tendances** - Graphique présence sur 3/6/12 mois
2. **Alertes** - Notifier si taux < seuil
3. **Comparaisons** - Équipe vs moyenne entreprise
4. **Prévisions** - Tendance future basée sur données passées

### Long Terme
1. **ML/Anomalies** - Détecter patterns inhabituels
2. **Dashboards personnalisés** - Par département, manager
3. **Notifications temps réel** - WebSocket updates
4. **Intégrations** - Slack, Teams, Email

## Dépannage

### "No logs found"
**Problème:** Pas de données de pointage pour la période
**Solution:** 
1. Générer données mock: `GET /api/v1/attendance/ingest-logs-mock`
2. Puis traiter: `GET /api/v1/attendance/process-logs-mock`

### Taux = 0%
**Problème:** Aucun pointage pour l'employé
**Solutions:**
1. Vérifier que l'employé existe
2. Vérifier qu'il a des pointages enregistrés
3. Vérifier la plage de dates

### Erreur "Invalid date format"
**Problème:** Format de date incorrect
**Solution:** Utiliser format `YYYY-MM-DD` (ex: `2024-01-15`)

## Performance

- **Calcul:** ~50-100ms pour 1 employé/mois
- **Bulk (tous employés):** ~500-1000ms selon nombre employés
- **Optimisation:** Les requêtes MongoDB utilisent indices sur user_id et timestamp

## Code Examples

### Python (utiliser le service)

```python
from app.services.attendance_metrics_service import AttendanceMetricsService
from datetime import date

service = AttendanceMetricsService()

# Métriques du mois courant
metrics = service.get_employee_attendance_status(
    employee_id=1,
    year=2024,
    month=2
)

print(f"Taux de présence: {metrics['presence_rate']}%")

# Plage personnalisée
range_metrics = service.get_employee_metrics_date_range(
    employee_id=1,
    start_date=date(2024, 1, 1),
    end_date=date(2024, 1, 31)
)
```

### JavaScript (fetch API)

```javascript
// Récupérer métriques
const response = await fetch(
  `http://localhost:8000/api/v1/attendance/metrics/all-employees?year=2024&month=2`
);
const data = await response.json();

if (data.status === "success") {
  data.data.forEach(employee => {
    console.log(`${employee.employee_name}: ${employee.presence_rate}%`);
  });
}
```

---

**Dernière mise à jour:** 2 février 2026
**Auteur:** Development Team
