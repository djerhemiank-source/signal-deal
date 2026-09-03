Issoire Connect V40 - source consolidee

Cette version est reconstruite a partir du HTML V3 compresse et regroupe les anciens scripts de patch dans un bundle unique, dans leur ordre d'execution historique.
Elle sert de version parallele de migration et ne remplace pas automatiquement l'application publique.

Fichiers principaux :
- base.html : HTML V3 decompresse, lisible
- index.html : HTML lisible chargeant un seul bundle
- app-v40.bundle.js : bundle V40 consolide
- sw.js : cache PWA propre a la version clean

La fiche entreprise Pro complete est validee par node --check avant construction du bundle.
Etape suivante : tests fonctionnels, puis refactorisation interne du bundle par domaines avant promotion publique.
