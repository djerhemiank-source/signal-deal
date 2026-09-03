Issoire Connect V40 - source consolidee

Cette version est reconstruite a partir du HTML V3 compresse et regroupe les scripts fonctionnels dans un bundle unique, dans leur ordre d'execution historique.
Elle sert aussi de solution de repli pour les navigateurs qui ne prennent pas en charge DecompressionStream.

Fichiers principaux :
- base.html : HTML V3 decompresse, lisible
- index.html : HTML lisible chargeant un seul bundle
- app-v40.bundle.js : bundle V40 consolide
- sw.js : cache PWA propre a la version clean

Les correctifs d'authentification, confirmation email, Radar Prospects et services Pro sont inclus dans le bundle.
