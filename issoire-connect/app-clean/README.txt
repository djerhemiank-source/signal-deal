Issoire Connect V41 - source consolidee

Cette version est reconstruite a partir du HTML V3 compresse et regroupe les scripts fonctionnels dans un bundle unique, dans leur ordre d'execution historique, avec functional-audit-fix-v41.js charge en dernier.
Elle sert aussi de solution de repli pour les navigateurs qui ne prennent pas en charge DecompressionStream.

Fichiers principaux :
- base.html : HTML V3 decompresse, lisible
- index.html : HTML lisible chargeant un seul bundle
- app-v40.bundle.js : bundle consolide V41
- sw.js : cache PWA propre a la version clean

V41 aligne la messagerie, les reservations, les commandes, les statuts de commande et les validations d'actions avec le backend reel.
