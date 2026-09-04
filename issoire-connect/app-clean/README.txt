Issoire Connect V50 - source consolidee

Cette version est reconstruite a partir du HTML V3 compresse et regroupe les scripts fonctionnels dans un bundle unique, dans leur ordre d'execution historique, jusqu'a order-push-v50.js.
Elle sert aussi de solution de repli pour les navigateurs qui ne prennent pas en charge DecompressionStream.

V50 conserve V49 et ajoute le Push securise des changements de statut de commande/reservation, avec notification persistante, anti-double-envoi et lien profond vers la transaction.

Fichiers principaux :
- base.html : HTML V3 decompresse, lisible
- index.html : HTML lisible chargeant un seul bundle
- app-v40.bundle.js : bundle consolide V50
- sw.js : cache PWA propre a la version clean
