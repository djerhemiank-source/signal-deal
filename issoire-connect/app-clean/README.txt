Issoire Connect V49 - source consolidee

Cette version est reconstruite a partir du HTML V3 compresse et regroupe les scripts fonctionnels dans un bundle unique, dans leur ordre d'execution historique, jusqu'a notifications-v49.js.
Elle sert aussi de solution de repli pour les navigateurs qui ne prennent pas en charge DecompressionStream.

V49 conserve V48 et ajoute le centre de notifications : non-lus, historique, marquage lu, temps reel et ouverture directe des transactions liees.

Fichiers principaux :
- base.html : HTML V3 decompresse, lisible
- index.html : HTML lisible chargeant un seul bundle
- app-v40.bundle.js : bundle consolide V49
- sw.js : cache PWA propre a la version clean
