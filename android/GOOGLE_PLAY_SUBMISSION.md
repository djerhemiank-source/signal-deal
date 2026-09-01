# Signal Deal — dossier Google Play V1

## État au 1 septembre 2026

Le dossier technique Signal Deal est prêt pour la création de l'application dans Google Play Console. Le seul blocage externe restant pour le compte développeur Organisation est l'obtention / propagation du numéro D-U-N-S après passage de l'entreprise en diffusion publique Sirene.

Validé :

- application Web publique ;
- Android API 36 ;
- AAB signé avec la clé d'upload Signal Deal ;
- smoke Android API 36 réussi ;
- smoke Chromium local + public réussi ;
- Stripe TEST validé de bout en bout ;
- Customer Portal Stripe LIVE actif ;
- webhook Stripe LIVE actif ;
- suppression de compte dans l'application et via ressource Web ;
- politique de confidentialité publique.

En attente externe :

- numéro D-U-N-S / validation du profil Organisation Google Play ;
- création définitive du compte Play Console ;
- import de l'AAB et saisie des formulaires Play Console.

## Identité technique

- Nom de l'application : Signal Deal
- Package : `fr.signaldeal.app`
- Version : `1.0.0`
- Version code : `1`
- Minimum Android : API 26
- API cible / compilation : API 36
- Certificat d'upload SHA-256 : `5B:C5:3C:F9:DB:91:9A:E3:EA:E3:9E:21:50:EF:93:2A:68:F5:BD:9B:60:55:4D:51:C4:4F:8A:5B:06:11:D5:B6`

Permissions Android déclarées :

- `android.permission.INTERNET`
- `android.permission.ACCESS_NETWORK_STATE`

Aucune permission Android de localisation, caméra, microphone, contacts, SMS ou stockage général n'est demandée.

## URLs publiques

- Application Web : https://djerhemiank-source.github.io/signal-deal/
- Politique de confidentialité : https://djerhemiank-source.github.io/signal-deal/privacy.html
- Suppression de compte : https://djerhemiank-source.github.io/signal-deal/delete-account.html
- Portail client Stripe LIVE : https://billing.stripe.com/p/login/dRm3cx1GE1WK6v30r06Zy00

## Positionnement Google Play

La version Google Play est une application compagnon pour l'utilisation du service Signal Deal. Elle permet aux utilisateurs de se connecter et d'utiliser les fonctionnalités autorisées par leur formule existante.

Les achats Stripe, les boutons d'achat et la gestion Stripe sont masqués / bloqués dans le mode `android-play`. Un utilisateur disposant déjà d'une formule peut se connecter et utiliser les droits correspondants.

Fonctions Android natives :

- WebView restreinte au domaine Signal Deal ;
- hôtes Stripe bloqués dans le build Google Play ;
- Safe Browsing activé ;
- contenu HTTP mixte refusé ;
- erreurs SSL refusées ;
- export CSV natif via le sélecteur de fichiers Android ;
- bouton Retour intégré à l'historique WebView ;
- gestion des insets système ;
- suppression de compte accessible depuis l'application et par une page Web publique.

## Fiche Play Store prête à copier

### Nom de l'application

Signal Deal

Limite Google Play : 30 caractères.

### Description courte

Repérez et organisez vos opportunités commerciales depuis votre mobile.

### Description complète

Signal Deal centralise des opportunités commerciales et aide à organiser leur suivi dans une interface claire pensée pour une utilisation professionnelle quotidienne.

Connectez-vous à votre compte pour consulter les opportunités accessibles avec votre formule, examiner les informations disponibles et gérer votre pipeline commercial.

Selon votre formule Signal Deal, vous pouvez notamment :

- consulter un volume adapté d'opportunités commerciales ;
- accéder aux sources et aux besoins associés lorsque votre formule le permet ;
- enregistrer et mettre à jour votre pipeline ;
- utiliser le matching pour prioriser certaines opportunités ;
- préparer votre approche commerciale ;
- calculer des estimations de commission ;
- exporter vos opportunités en CSV depuis les formules compatibles.

La version distribuée sur Google Play ne propose pas d'achat dans l'application. Elle permet d'utiliser un compte et une formule Signal Deal déjà actifs.

Signal Deal ne garantit aucun résultat commercial. Les scores, estimations et informations affichés sont des indicateurs destinés à faciliter la prospection, la qualification et l'organisation du suivi commercial.

### Catégorie proposée

- Type : Application
- Catégorie : Business / Professionnel

### Public cible proposé

- Adultes / professionnels.
- L'application n'est pas conçue spécifiquement pour les enfants.

### Annonces

Réponse proposée : **Non**.

L'application Android n'intègre aucun SDK publicitaire et n'affiche pas de publicité.

## Accès à l'application pour l'équipe Google Play

Google exige un accès permanent et réutilisable lorsque des fonctionnalités sont derrière une connexion ou une formule.

Réponse proposée dans Play Console :

- « Tout ou partie des fonctionnalités est restreint » : **Oui**.
- Fournir un compte de démonstration dédié à Google Play, différent de tout compte personnel ou client réel.
- Le compte de démonstration devra disposer d'une formule permettant de tester les principales fonctions sans paiement réel ni OTP variable.

Instructions en anglais à copier une fois le compte de démonstration créé :

`Open Signal Deal and tap Sign in. Use the review account credentials supplied below. The account is preconfigured for Google Play review and gives access to the main application features. No purchase is required inside the Android app.`

À compléter avant soumission :

- Review email: `[À CRÉER]`
- Review password: `[À CRÉER]`

Le mot de passe doit rester valide pendant toute la durée de la revue.

## Data Safety — réponses préparées

La déclaration finale doit correspondre exactement au comportement de la version envoyée et aux prestataires utilisés à la date de soumission.

### L'application collecte-t-elle ou partage-t-elle des données utilisateur ?

Réponse proposée : **Oui, elle collecte certaines données nécessaires au compte et au fonctionnement du service.**

### Données collectées

#### Informations personnelles — Adresse e-mail

- Collectée : Oui
- Partagée à des fins publicitaires : Non
- Obligatoire : Oui pour un compte Signal Deal
- Finalités : fonctionnement de l'application, gestion du compte, sécurité

#### Informations personnelles — ID utilisateur

- Collecté : Oui
- Partagé à des fins publicitaires : Non
- Finalités : fonctionnement de l'application, gestion du compte, sécurité

#### Informations personnelles — Nom

- Collecté : Oui seulement si l'utilisateur le fournit
- Facultatif : Oui
- Finalités : gestion du compte / fonctionnement de l'application

#### Activité dans l'application — Autre contenu généré par l'utilisateur

Couvre notamment les données de pipeline, statuts de suivi, notes ou données enregistrées par l'utilisateur lorsque ces fonctions sont utilisées.

- Collecté : Oui
- Partagé à des fins publicitaires : Non
- Finalités : fonctionnement de l'application

#### Historique des achats

À déclarer uniquement si Play Console considère le statut/formule et les données d'abonnement synchronisées dans Signal Deal comme un historique de transaction utilisateur. L'application Android ne collecte ni numéro de carte ni coordonnées bancaires. Les paiements sont réalisés hors de l'application Android et traités par Stripe sur le Web.

### Données explicitement non collectées par les fonctions Android

- position précise ou approximative à des fins fonctionnelles ;
- contacts ;
- SMS/MMS ;
- caméra / photos imposées ;
- microphone / audio ;
- calendrier ;
- liste des applications installées ;
- identifiant publicitaire ;
- informations de carte bancaire dans l'application Android.

### Fichiers et documents

L'export CSV utilise le sélecteur Android `ACTION_CREATE_DOCUMENT`. L'utilisateur choisit explicitement l'emplacement de destination. Signal Deal n'accède pas de manière générale aux fichiers personnels de l'appareil.

### Partage

Aucun partage de données avec des partenaires publicitaires ou des courtiers en données.

Prestataires techniques mentionnés dans la politique de confidentialité :

- Supabase : authentification, base de données, fonctions serveur ;
- Stripe : paiements et abonnements réalisés sur le Web ;
- GitHub Pages : hébergement de l'interface Web publique.

La qualification « partagé » dans le formulaire Data Safety doit être remplie conformément aux définitions Google Play applicables aux prestataires de service ; ne pas déclarer un usage publicitaire inexistant.

### Sécurité

Réponses proposées :

- Données chiffrées en transit : **Oui** (HTTPS/TLS).
- Suppression de compte disponible : **Oui**.
- Demande de suppression dans l'application : **Oui**.
- Ressource de suppression hors application : **Oui**.
- URL de suppression : https://djerhemiank-source.github.io/signal-deal/delete-account.html

## Suppression de compte

Le parcours est disponible :

1. depuis Signal Deal : « Supprimer mon compte » ;
2. depuis la page Web publique `delete-account.html` ;
3. authentification obligatoire avant suppression ;
4. suppression des données Signal Deal associées ;
5. les données légalement requises par un prestataire de paiement peuvent être conservées conformément aux obligations applicables ;
6. si l'identité technique est partagée avec un autre service du même projet, seules les données et l'accès Signal Deal sont supprimés afin de ne pas détruire le compte de l'autre service.

## Confidentialité

La politique est accessible publiquement et depuis l'application.

Avant soumission finale, ajouter / confirmer l'identité légale de l'exploitant et les coordonnées publiques qui seront utilisées dans Play Console afin que la politique et le profil développeur restent cohérents.

## Contenu et déclarations Play Console

### Application ou jeu

Application.

### Gratuite ou payante dans Google Play

Application gratuite à télécharger.

### Achats intégrés Google Play

Aucun achat intégré dans cette version Android.

### Contient des annonces

Non.

### Accès restreint

Oui : compte requis pour le tableau de bord et les fonctions personnelles.

### Classification du contenu

Positionnement attendu : application professionnelle / commerciale, sans violence, sexualité, jeux d'argent ou substances réglementées. Répondre au questionnaire IARC selon le contenu réellement affiché au moment de la soumission.

## Éléments graphiques requis

À préparer :

- icône Play Store : PNG 512 × 512, maximum 1 024 Ko ;
- feature graphic : 1 024 × 500 ;
- captures d'écran téléphone : au moins 2 captures représentatives ;
- captures recommandées à partir du runtime Android réel ;
- textes alternatifs distincts pour les captures lorsque Play Console les demande.

Captures recommandées :

1. écran d'accueil / présentation de Signal Deal ;
2. écran de connexion ;
3. tableau de bord avec opportunités ;
4. pipeline commercial ;
5. détail d'une opportunité / actions disponibles.

Ne pas montrer d'adresse e-mail réelle, identifiant personnel, données de paiement ou autres informations privées dans les captures Store.

## Texte de version 1.0.0

Première version Android de Signal Deal.

- accès sécurisé au compte Signal Deal ;
- consultation des opportunités commerciales ;
- suivi du pipeline ;
- utilisation des fonctionnalités correspondant à la formule active ;
- export CSV pour les formules compatibles ;
- suppression de compte accessible depuis l'application.

## Checklist avant import de l'AAB

- [x] package `fr.signaldeal.app`
- [x] versionCode 1
- [x] versionName 1.0.0
- [x] targetSdk 36
- [x] AAB signé
- [x] certificat d'upload sauvegardé hors dépôt
- [x] smoke Android API 36 réussi
- [x] politique de confidentialité publique
- [x] suppression de compte in-app + Web
- [x] Stripe LIVE Customer Portal actif
- [x] webhook LIVE actif
- [x] aucun achat Stripe exposé dans le build Google Play
- [ ] D-U-N-S reçu / visible
- [ ] compte développeur Organisation créé
- [ ] identité légale finalisée dans la politique de confidentialité
- [ ] compte de démonstration Google Play créé
- [ ] icône 512 × 512 finalisée
- [ ] feature graphic 1024 × 500 finalisée
- [ ] captures Store finalisées
- [ ] formulaire Data Safety saisi dans Play Console
- [ ] questionnaire contenu / IARC rempli
- [ ] AAB importé en piste de test

## Notes de conformité

Google Play demande que la fiche Store corresponde au comportement réel de l'application. Ne pas annoncer une fonction inaccessible dans le build soumis.

Pour les applications avec connexion, fournir à Google Play des identifiants de démonstration actifs, réutilisables et valides indépendamment de la localisation du reviewer.

Pour une application permettant la création d'un compte, Google Play exige une voie de suppression depuis l'application et une ressource Web externe ; Signal Deal fournit les deux.
