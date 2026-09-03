Issoire Connect V46 - source consolidee

Cette version est reconstruite a partir du HTML V3 compresse et regroupe les scripts fonctionnels dans un bundle unique, dans leur ordre d'execution historique, jusqu'a reliability-v46.js.
Elle sert aussi de solution de repli pour les navigateurs qui ne prennent pas en charge DecompressionStream.

V46 fiabilise notamment l'autorite d'abonnement du Radar Prospects, la liaison entreprise/proprietaire avant messagerie et les boutons de reservation.

Fichiers principaux :
- base.html : HTML V3 decompresse, lisible
- index.html : HTML lisible chargeant un seul bundle
- app-v40.bundle.js : bundle consolide V46
- sw.js : cache PWA propre a la version clean
