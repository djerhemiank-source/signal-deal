Issoire Connect V47 - source consolidee

Cette version est reconstruite a partir du HTML V3 compresse et regroupe les scripts fonctionnels dans un bundle unique, dans leur ordre d'execution historique, jusqu'au correctif business-modal-v47-fix.js.
Elle sert aussi de solution de repli pour les navigateurs qui ne prennent pas en charge DecompressionStream.

V47 conserve les garde-fous V46 et ajoute les avis/recommandations, la messagerie regroupee en conversations et la reouverture fiable des fiches entreprise apres authentification.

Fichiers principaux :
- base.html : HTML V3 decompresse, lisible
- index.html : HTML lisible chargeant un seul bundle
- app-v40.bundle.js : bundle consolide V47
- sw.js : cache PWA propre a la version clean
