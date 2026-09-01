# Signal Deal — dossier Google Play V1

## Identité technique

- Nom de l'application : Signal Deal
- Package : `fr.signaldeal.app`
- Version : `1.0.0`
- Version code : `1`
- Minimum Android : API 26
- API cible / compilation : API 36
- Certificat d'upload SHA-256 : `5B:C5:3C:F9:DB:91:9A:E3:EA:E3:9E:21:50:EF:93:2A:68:F5:BD:9B:60:55:4D:51:C4:4F:8A:5B:06:11:D5:B6`

## URLs publiques obligatoires

- Application Web : https://djerhemiank-source.github.io/signal-deal/
- Politique de confidentialité : https://djerhemiank-source.github.io/signal-deal/privacy.html
- Suppression de compte : https://djerhemiank-source.github.io/signal-deal/delete-account.html

## Positionnement de la version Google Play

La version Google Play est une application compagnon pour l'utilisation du service Signal Deal. Elle permet aux utilisateurs de se connecter et d'utiliser les fonctionnalités autorisées par leur formule existante. Les achats Stripe et la gestion Stripe ne sont pas proposés dans cette version Android.

Fonctions Android natives ajoutées autour du service Web :

- navigation WebView restreinte au domaine Signal Deal ;
- blocage explicite des hôtes Stripe dans le build Google Play ;
- Safe Browsing et refus du contenu mixte ;
- refus des erreurs SSL ;
- export CSV natif via le sélecteur de fichiers Android ;
- bouton Retour intégré à l'historique WebView ;
- gestion des insets système et de l'état de l'activité ;
- suppression de compte accessible depuis l'application et par une page Web publique.

## Proposition de fiche Play Store

### Titre

Signal Deal

### Description courte

Repérez, suivez et organisez vos opportunités commerciales depuis votre mobile.

### Description complète

Signal Deal centralise des opportunités commerciales et aide à organiser leur suivi dans une interface claire, pensée pour une utilisation quotidienne.

Connectez-vous à votre compte pour consulter les opportunités accessibles avec votre formule, examiner les informations disponibles et gérer votre pipeline commercial.

Selon votre formule Signal Deal, vous pouvez notamment :

- consulter un volume adapté d'opportunités ;
- accéder aux sources et aux besoins associés ;
- enregistrer et mettre à jour votre pipeline ;
- utiliser le matching pour prioriser certaines opportunités ;
- préparer votre approche commerciale ;
- calculer des commissions ;
- exporter vos opportunités en CSV depuis les formules compatibles.

La version Google Play ne propose pas d'achat dans l'application. Elle permet d'utiliser un compte et une formule Signal Deal déjà actifs.

Signal Deal ne fournit pas de garantie de résultat commercial. Les scores, estimations et informations affichés constituent des indicateurs d'aide à la prospection et à l'organisation.

## Data Safety — inventaire technique à déclarer

La déclaration finale dans Play Console doit rester conforme au comportement réel et aux prestataires au jour de la soumission.

### Données utilisées par Signal Deal

- Adresse e-mail : compte, authentification et gestion du service.
- Identifiant utilisateur : authentification et rattachement des données au compte.
- Nom : seulement s'il est fourni par l'utilisateur.
- Statut/formule d'abonnement et identifiants techniques d'abonnement : application des droits du compte.
- Pipeline, prospects locaux et données de commission enregistrés : fonctionnalité du service.

### Données / permissions non demandées par l'application Android

- aucune géolocalisation ;
- aucun contact ;
- aucune caméra ;
- aucun microphone ;
- aucun SMS ;
- aucun SDK publicitaire ;
- aucun accès général aux fichiers personnels de l'appareil.

L'accès à un emplacement de fichier intervient uniquement lorsque l'utilisateur choisit explicitement où enregistrer un export CSV via le sélecteur Android.

### Sécurité et suppression

- communications HTTPS/TLS ;
- contenu HTTP mixte refusé ;
- erreurs SSL refusées ;
- suppression de compte disponible dans l'application ;
- ressource Web de suppression disponible hors de l'application ;
- endpoint de suppression protégé par authentification ;
- une suppression Signal Deal terminée bloque la réouverture du service pour cette identité ;
- lorsque l'identité d'authentification est partagée avec un autre service du même projet, les données Signal Deal sont supprimées sans détruire les données de l'autre service.

## Éléments graphiques à fournir avant publication

- icône Play Store 512 × 512 ;
- feature graphic 1024 × 500 ;
- au moins 2 captures d'écran téléphone ;
- idéalement captures produites à partir du smoke Android API 36 réel.

## Points restant externes

1. Le nom légal / nom développeur affiché dans Google Play Console doit être reporté dans la politique de confidentialité avant soumission finale.
2. Le Customer Portal Stripe doit être activé avec une autorisation Stripe permettant `POST /v1/billing_portal/configurations`.
3. Les secrets GitHub de signature peuvent être ajoutés pour automatiser les futurs bundles signés ; le keystore privé ne doit jamais être ajouté au dépôt.
