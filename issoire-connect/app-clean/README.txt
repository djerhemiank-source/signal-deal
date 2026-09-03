Issoire Connect V48 - source consolidee

Cette version est reconstruite a partir du HTML V3 compresse et regroupe les scripts fonctionnels dans un bundle unique, dans leur ordre d'execution historique, jusqu'a transaction-experience-v48.js.
Elle sert aussi de solution de repli pour les navigateurs qui ne prennent pas en charge DecompressionStream.

V48 conserve les garde-fous V47 et ajoute le parcours transactionnel : statut professionnel securise, ajout des reservations a l'agenda et avis verifies apres transaction terminee.

Fichiers principaux :
- base.html : HTML V3 decompresse, lisible
- index.html : HTML lisible chargeant un seul bundle
- app-v40.bundle.js : bundle consolide V48
- sw.js : cache PWA propre a la version clean
