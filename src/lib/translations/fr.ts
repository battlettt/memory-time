import type { Catalogue } from './index';

/**
 * French.
 *
 * Written for a caregiver reading it every day, not for a brochure: plain
 * verbs, vouvoiement throughout, and the same deliberate softness as the
 * English — nothing here should read as a test the family is failing.
 */
export const fr: Catalogue = {
  'tab.today': 'Aujourd’hui',
  'tab.memories': 'Souvenirs',
  'tab.album': 'Album',
  'tab.story': 'Histoire',
  'tab.settings': 'Réglages',

  'common.loading': 'Chargement…',
  'common.done': 'Terminé',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.tryAgain': 'Réessayer',
  'common.addedBy': 'Ajouté par {name}',
  'common.sharedBy': 'Partagé par {name}',
  'common.aFamilyMember': 'Un membre de la famille',
  'common.somethingWrong': 'Une erreur est survenue',

  'today.eyebrow': 'AUJOURD’HUI',
  'today.title': 'Un moment avec {name}',
  'today.empty.title': 'Le recueil est vide',
  'today.empty.body':
    'Ajoutez quelques photos et questions au sujet de {name}, et les séances se construiront d’elles-mêmes.',
  'today.empty.action': 'Ajouter le premier souvenir',
  'today.ready_one': 'souvenir prêt',
  'today.ready_other': 'souvenirs prêts',
  'today.moreWaiting': '{count} autres attendent — ils reviendront la prochaine fois.',
  'today.moreDue': '{count} autres reviendront le moment venu.',
  'today.anyPace': 'Allez au rythme qui vous convient.',
  'today.start': 'Commencer une séance',
  'today.caughtUp.title': 'Tout est à jour',
  'today.caughtUp.body':
    'Tout le recueil a été revu récemment. Les souvenirs reviennent d’eux-mêmes — vous n’avez rien à faire aujourd’hui.',
  'today.prompt.eyebrow': 'UNE QUESTION POUR VOUS',
  'today.prompt.answer': 'Répondre à voix haute',
  'today.album': 'Feuilleter l’album',
  'today.handOver': 'Passer l’écran à {name}',
  'today.grandchild': 'Une mission pour un petit-enfant',

  'memorial.eyebrow': 'EN SOUVENIR',
  'memorial.title': 'Tout est toujours là',
  'memorial.body':
    'Les photos, l’histoire et chaque enregistrement de voix. Rien ne vous demandera de faire une séance ni ne vous rappellera d’ouvrir l’application.',
  'memorial.readStory': 'Lire l’histoire de {name}',

  'session.title': 'Séance',
  'session.left_one': '{count} souvenir restant',
  'session.left_other': '{count} souvenirs restants',
  'session.remaining': '{count} souvenirs restants dans cette séance',
  'session.hint': 'Donner un indice',
  'session.hintText': 'Cela commence par « {letter} »',
  'session.hintFallback': 'Prenez votre temps',
  'session.reveal': 'Afficher la réponse',
  'session.remembered': 'Elle s’en est souvenue',
  'session.neededHand': 'A eu besoin d’aide',
  'session.notToday': 'Pas aujourd’hui',
  'session.setAside': 'Mis de côté — ne reviendra pas avant quelques semaines.',
  'session.stoppedEarly':
    'Nous nous sommes arrêtés tôt aujourd’hui — une courte séance reste une bonne séance.',
  'session.switchedFamiliar':
    'Passage à des souvenirs plus familiers pour le reste de la séance.',
  'session.complete': 'Séance terminée',
  'session.practised_one': '{count} souvenir revu ensemble.',
  'session.practised_other': '{count} souvenirs revus ensemble.',

  'elderRec.idle': 'Enregistrer {name} qui raconte',
  'elderRec.recording': 'Enregistrement — appuyez pour arrêter',
  'elderRec.saving': 'Enregistrement…',
  'elderRec.saved': 'Conservé avec sa propre voix',
  'elderRec.failed': 'Impossible d’enregistrer — appuyez pour réessayer',
  'elderRec.heading': 'AVEC LA VOIX DE {name}',
  'elderRec.note':
    'Enregistré pendant les séances. C’est ce que les familles regrettent le plus de ne pas avoir.',

  'voice.play': 'Écouter leur voix',
  'voice.playing': 'Lecture…',
  'voice.failed': 'Impossible de lire cet enregistrement',
  'voice.retry': 'Appuyez pour réessayer',
  'voice.recordedBy': 'Enregistré par {name}',

  'recorder.label': 'Note vocale',
  'recorder.hint': 'Facultatif — une voix familière aide plus qu’un texte',
  'recorder.recording': 'Enregistrement…',
  'recorder.saved': 'Note vocale enregistrée',
  'recorder.start': 'Enregistrer une note vocale',
  'recorder.again': 'Réenregistrer',
  'recorder.remove': 'Supprimer la note vocale',
  'recorder.live': 'Transcription pendant que vous parlez',

  'album.title': 'Album',
  'album.subtitle': 'Simplement à regarder — aucune question ici.',
  'album.anniversaries_one': '{count} anniversaire aujourd’hui.',
  'album.anniversaries_other': '{count} anniversaires aujourd’hui.',
  'album.empty.title': 'Pas encore de photos',
  'album.empty.body':
    'Les photos ajoutées aux souvenirs apparaissent ici, en pleine largeur, pour regarder tranquillement avec {name}.',
  'album.yearsAgo_one': 'il y a {count} an, jour pour jour',
  'album.yearsAgo_other': 'il y a {count} ans, jour pour jour',

  'memories.title': 'Souvenirs',
  'memories.subtitle': 'Les questions et les photos que {name} travaille.',
  'memories.import': 'Ajouter depuis les photos',
  'memories.topicIdeas': 'Idées de sujets',
  'memories.byDecade': 'Questions par décennie',
  'memories.addByHand': 'Ajouter à la main',
  'memories.search': 'Rechercher un souvenir',
  'memories.voiceNote': 'note vocale',
  'memories.resting': 'En pause — toujours dans l’album',
  'memories.setAside': 'Mis de côté pour l’instant',
  'memories.empty.title': 'Rien dans le recueil',
  'memories.empty.body':
    'Les questions par décennie fonctionnent tout de suite, sans rien téléverser — une bonne demi-heure ensemble avant même d’avoir ajouté une photo.',
  'memories.empty.action': 'Voir les questions par décennie',
  'memories.noMatch.title': 'Aucun résultat',
  'memories.noMatch.body': 'Aucun souvenir ne mentionne « {query} ». Essayez un nom ou un lieu.',
  'memories.open': 'Ouvrir le souvenir : {question}',

  'addMemory.title': 'Ajouter un souvenir',
  'addMemory.kind': 'QUEL TYPE DE SOUVENIR',
  'addMemory.kind.relationship': 'Qui est cette personne pour elle',
  'addMemory.kind.identity': 'À propos de {name}',
  'addMemory.kind.event': 'Un moment ou un événement',
  'addMemory.qa': 'LA QUESTION ET LA RÉPONSE',
  'addMemory.question': 'Question',
  'addMemory.questionPlaceholder': 'Qui est-ce sur la photo ?',
  'addMemory.answer': 'Réponse',
  'addMemory.answerPlaceholder': 'C’est Sarah, ta petite-fille',
  'addMemory.answerHint': 'Écrivez-le comme vous le diriez à voix haute.',
  'addMemory.language': 'LANGUE',
  'addMemory.languageHint':
    'Seulement si ce souvenir se dit mieux dans une autre langue — on revient souvent à sa langue d’origine.',
  'addMemory.media': 'PHOTO ET VOIX',
  'addMemory.note': 'UN MOT DE VOUS',
  'addMemory.notePlaceholder': 'J’aime beaucoup celui-là !',
  'addMemory.noteHint': 'Facultatif — affiché à côté de la réponse pendant la séance.',
  'addMemory.save': 'Enregistrer le souvenir',
  'addMemory.needBoth': 'Il faut une question et une réponse pour pouvoir travailler dessus.',
  'addMemory.saveFailed': 'Impossible d’enregistrer ce souvenir',

  'memory.title': 'Souvenir',
  'memory.when': 'C’était quand ?',
  'memory.whenPlaceholder': '1962, mars 1962, ou les années 70',
  'memory.whenHint': 'Aussi précisément que vous vous en souvenez — une année suffit.',
  'memory.whenInvalid': 'Essayez une année comme 1962, « mars 1962 », ou « les années 70 ».',
  'memory.noteLabel': 'Un mot de vous',
  'memory.languageLabel': 'Langue',
  'memory.languageHint':
    'Appuyez à nouveau pour effacer. On revient souvent à sa première langue avec le temps.',
  'memory.anchor': 'Toujours poser celle-ci',
  'memory.anchorHint':
    'Les repères — un mari, une fille, son propre nom — reviennent toujours, même souvent oubliés.',
  'memory.resting.title': 'En pause',
  'memory.resting.body':
    'Cette question n’est plus posée après plusieurs séances difficiles. Elle reste dans l’album.',
  'memory.paused.title': 'Mis de côté pour l’instant',
  'memory.paused.body': 'Marqué « pas aujourd’hui » pendant une séance.',
  'memory.saveChanges': 'Enregistrer les modifications',
  'memory.unretire': 'Reposer cette question',
  'memory.retire': 'Mettre en pause',
  'memory.delete': 'Supprimer ce souvenir',
  'memory.deleteConfirm': 'Appuyez encore pour supprimer définitivement',
  'memory.deleteWarning': 'La photo et la note vocale seront supprimées aussi. Irréversible.',
  'memory.deleteFailed': 'Impossible de supprimer ce souvenir',

  'import.title': 'Ajouter depuis les photos',
  'import.empty.title': 'Ajouter des photos par lot',
  'import.empty.body':
    'Choisissez jusqu’à {max} photos et chacune reçoit une question et une réponse proposées. Vous les corrigez, puis elles sont ajoutées — bien plus rapide que de tout taper sur {name}.',
  'import.choose': 'Choisir des photos',
  'import.camera': 'Photographier un tirage',
  'import.shoebox':
    'La plupart des familles ont une boîte à chaussures, pas une photothèque. Photographier un tirage marche aussi bien.',
  'import.reading': 'Lecture des photographies…',
  'import.readingBody':
    'Rédaction d’une question pour chacune. Vous pourrez tout corriger avant l’enregistrement.',
  'import.saving': 'Enregistrement…',
  'import.savingProgress': '{done} sur {total} enregistrés.',
  'import.review.title': 'Vérifiez ceci',
  'import.review.body':
    'Ce sont des propositions. Rien n’est enregistré tant que vous n’appuyez pas sur le bouton en bas, et tout ce qui contient un blanc entre crochets a besoin d’un vrai nom.',
  'import.noDate': 'Pas de date dans le fichier',
  'import.needsName': 'Nom à compléter',
  'import.skip': 'Passer celle-ci',
  'import.keep': 'Garder',
  'import.nothingSelected': 'Rien de sélectionné',
  'import.save_one': 'Enregistrer {count} souvenir',
  'import.save_other': 'Enregistrer {count} souvenirs',
  'import.nothingBack':
    'Rien n’est revenu pour ces photos. Vous pouvez toujours les ajouter à la main.',
  'import.readFailed': 'Impossible de lire ces photos',
  'import.saveFailed': 'Impossible d’enregistrer ces souvenirs',

  'era.title': 'Par décennie',
  'era.subtitle':
    'Des questions sur les années où {name} était jeune — utile quand les photos manquent.',
  'era.why':
    'La mémoire de sa propre vie culmine entre dix et trente ans : la décennie de la jeunesse est bien plus riche que l’an dernier.',
  'era.use': 'Utiliser la question : {question}',

  'daily.title': 'La question du jour',
  'daily.eyebrow': 'LA QUESTION DU JOUR',
  'daily.body':
    'Vingt secondes à voix haute valent mieux qu’un paragraphe tapé — {name} entendra votre vraie voix pendant la séance.',
  'daily.write': 'Ou écrivez-le',
  'daily.writePlaceholder': 'Elle travaillait à l’usine depuis ses quinze ans…',
  'daily.writeHint': 'Facultatif si vous avez enregistré quelque chose.',
  'daily.add': 'Ajouter au recueil',
  'daily.needSomething': 'Enregistrez quelque chose ou écrivez une ligne — l’un ou l’autre suffit.',
  'daily.alreadyAnswered':
    'Vous avez déjà répondu à celle-ci aujourd’hui. Une autre question arrive demain.',
  'daily.none': 'Pas de question aujourd’hui. Revenez demain.',
  'daily.saveFailed': 'Impossible d’enregistrer',
  'daily.spokenAnswer': 'Répondu à voix haute — appuyez sur lecture pour écouter.',
  'daily.notificationTitle': 'Une question sur {name}',
  'daily.notificationBody': 'Répondez à voix haute — cela prend une vingtaine de secondes.',

  'kid.title': 'Une mission pour un petit-enfant',
  'kid.eyebrow': 'DEMANDE À {name}',
  'kid.body': 'Lis la question à voix haute, appuie sur le gros bouton, et laisse-la répondre.',
  'kid.start': 'Commencer l’enregistrement',
  'kid.stop': 'Arrêter — elle a fini',
  'kid.saving': 'Enregistrement…',
  'kid.failed': 'Ça n’a pas marché — réessaie',
  'kid.saved': 'Enregistré',
  'kid.savedBody':
    'C’est maintenant conservé avec la voix de {name}. Toute la famille peut l’écouter.',
  'kid.another': 'Poser une autre question',
  'kid.allDone': 'C’est fini',
  'kid.answeredAloud': '{name} a répondu à voix haute.',

  'elder.empty.title': 'Pas encore de photographies',
  'elder.empty.body':
    'Dès que la famille aura ajouté des photos, elles apparaîtront ici à regarder.',
  'elder.back': 'Retour à l’application',
  'elder.next': 'Suivante',
  'elder.previous': 'Photographie précédente',
  'elder.nextLabel': 'Photographie suivante',
  'elder.hold': 'Maintenir pour quitter',
  'elder.holdLabel': 'Maintenir pour quitter ce mode',

  'story.eyebrow': 'SON HISTOIRE',
  'story.title': 'Qui est vraiment {name}',
  'story.subtitle':
    'Un portrait vivant, pas un questionnaire — pour la famille, un nouvel aidant, ou un petit-enfant qui n’a pas eu le temps de la connaître.',
  'story.progress': '{done} chapitres sur {total} rédigés',
  'story.notWritten': 'Pas encore écrit — appuyez pour ajouter',
  'story.edit': 'Modifier ce chapitre',

  'chapter.early_life': 'Enfance',
  'chapter.career': 'Métier',
  'chapter.family': 'Famille',
  'chapter.personality': 'Caractère',
  'chapter.favorites': 'Ce qu’elle aime',
  'chapter.stories': 'Anecdotes',

  'settings.title': 'Réglages',
  'settings.you': 'Vous êtes {name} · {count} dans ce groupe',
  'settings.people_one': '{count} personne',
  'settings.people_other': '{count} personnes',
  'settings.switchGroup': 'CHANGER DE GROUPE',
  'settings.invite': 'INVITER LA FAMILLE',
  'settings.inviteBody':
    'Plus il y a de personnes qui ajoutent des souvenirs, plus le recueil est riche. Toute personne ayant un code peut ajouter photos et histoires depuis son téléphone.',
  'settings.inviteCreate': 'Créer un code d’invitation',
  'settings.inviteExpiry': 'Partagez ce code. Il expire dans 14 jours.',
  'settings.forYou': 'POUR VOUS',
  'settings.forYouBody': 'C’est vous qui faites le travail. Ces deux pages sont pour vous.',
  'settings.report': 'Cette semaine',
  'settings.handoff': 'Une page pour un nouvel aidant',
  'settings.book': 'Créer un livre',
  'settings.bookBuilding': 'Création du livre…',
  'settings.bookBody':
    'L’histoire et les photographies en un seul document à imprimer et à garder. Sans cette application, sans compte, sans nous.',
  'settings.preferences': 'PRÉFÉRENCES',
  'settings.largeText': 'Texte plus grand',
  'settings.largeTextBody':
    'S’applique aux séances, à l’album et à l’écran de passation — ceux que {name} lit vraiment.',
  'settings.dailyQuestion': 'Une question chaque jour',
  'settings.dailyQuestionBody': 'Une question, à {hour} h, à laquelle répondre à voix haute.',
  'settings.dailyQuestionWeb':
    'Une question par jour sur l’écran Aujourd’hui. Les rappels nécessitent l’application mobile.',
  'settings.sessionLength': 'Durée des séances',
  'settings.sessionLengthBody':
    'Les séances courtes se terminent ; les longues sont abandonnées.',
  'settings.appLanguage': 'Langue de l’application',
  'settings.appLanguageBody':
    'Change les boutons et les libellés, pas les souvenirs écrits par votre famille.',
  'settings.followDevice': 'Suivre mon appareil',
  'settings.shareLink': 'PARTAGER UN LIEN',
  'settings.shareLinkBody':
    'Pour les proches qui n’installeront pas d’application. Ils ouvrent le lien, écrivent un souvenir et l’envoient — sans compte. Tout ce qui arrive vous est présenté d’abord.',
  'settings.createLink': 'Créer un lien',
  'settings.copied': 'Copié dans le presse-papiers',
  'settings.copy': 'Copier',
  'settings.share': 'Partager',
  'settings.turnOff': 'Désactiver',
  'settings.linkSent': '{count} envoyés · expire le {date}',
  'settings.memorialOff': 'SI ELLE EST DÉCÉDÉE',
  'settings.memorialOn': 'UN LIEU DE SOUVENIR',
  'settings.memorialOffBody':
    'Activer ceci arrête tous les rappels et toutes les invitations à faire une séance, et conserve l’album, l’histoire et les enregistrements. Vous pouvez le désactiver ensuite.',
  'settings.memorialOnBody':
    'Les rappels sont désactivés et rien ne vous demandera de faire une séance. L’album, l’histoire et les enregistrements restent exactement tels quels.',
  'settings.memorialEnable': 'Activer le mode souvenir',
  'settings.memorialConfirm': 'Appuyez encore pour activer',
  'settings.memorialDisable': 'Reprendre les séances',
  'settings.signOut': 'Se déconnecter',

  'report.title': 'Cette semaine',
  'report.subtitle': 'À garder, ou à envoyer à la famille.',
  'report.noSessions':
    'Aucune séance cette semaine. C’est permis — les souvenirs gardent leur place.',
  'report.minutes_one': 'Vous avez passé {count} minute avec {name} cette semaine.',
  'report.minutes_other': 'Vous avez passé {count} minutes avec {name} cette semaine.',
  'report.sessions_one': '{count} séance avec {name} cette semaine.',
  'report.sessions_other': '{count} séances avec {name} cette semaine.',
  'report.sessionLine': '{sessions} · {memories} abordés',
  'report.sessionCount_one': '{count} séance',
  'report.sessionCount_other': '{count} séances',
  'report.memoryCount_one': '{count} souvenir',
  'report.memoryCount_other': '{count} souvenirs',
  'report.timeOfDay': '{name} réussit mieux {bucket}',
  'report.timeOfDayBody':
    '{best} % rappelés {bucket} contre {other} % {otherBucket}, sur {sample} réponses. Cela vaut la peine d’essayer à ce moment-là.',
  'report.bucket.morning': 'le matin',
  'report.bucket.afternoon': 'l’après-midi',
  'report.bucket.evening': 'le soir',
  'report.holding': 'BIEN ANCRÉS',
  'report.holdingEmpty':
    'Rien n’a encore atteint un long intervalle. Cela demande quelques semaines.',
  'report.slipping': 'QUI S’EFFACENT',
  'report.slippingBody':
    'Oubliés plus d’une fois récemment. Ajouter une photo ou une note vocale aide souvent plus que de travailler davantage.',
  'report.slippingEmpty': 'Rien ne s’efface pour le moment.',
  'report.resting': 'EN PAUSE',
  'report.restingBody':
    'Ces questions ne sont plus posées après plusieurs séances difficiles. Elles restent dans l’album, et vous pouvez les reprendre depuis leur page.',
  'report.added': 'AJOUTÉS CETTE SEMAINE',
  'report.addedEmpty':
    'Rien de nouveau cette semaine — la question du jour est le moyen le plus simple.',
  'report.quiet.title': 'Une semaine calme',
  'report.quiet.body':
    'Rien n’est perdu si vous sautez une semaine — tout garde sa place et revient le moment venu.',
  'report.andMore': 'et {count} de plus',

  'handoff.title': 'À propos de {name}',
  'handoff.subtitle': 'Pour un nouvel aidant, un séjour de répit, ou une hospitalisation.',
  'handoff.anchors': 'LES PERSONNES QUI COMPTENT LE PLUS',
  'handoff.language':
    '{name} peut revenir à {languages}. Des enregistrements de la famille sont dans l’application.',
  'handoff.advice':
    'Si un nom ou une date sort de travers, laissez passer. Corriger coûte plus cher que l’erreur — entrer dans son récit préserve la conversation, et c’est la conversation qui compte.',
  'handoff.copy': 'Copier cette page',
  'handoff.send': 'Envoyer cette page',
  'handoff.copied': 'Copié',
  'handoff.empty.title': 'Rien à transmettre pour l’instant',
  'handoff.empty.body':
    'Écrivez un ou deux chapitres de l’histoire de {name}, ou marquez quelques souvenirs comme « toujours poser », et cette page se composera toute seule.',

  'topics.title': 'Idées de sujets',
  'topics.failed': 'Impossible d’obtenir des suggestions pour l’instant. Réessayez dans un moment.',

  'auth.tagline':
    'Recueillez les histoires de vos parents tant que c’est possible — les photos, leur voix, les petites choses que personne n’écrit.',
  'auth.startGroup': 'Créer un nouveau groupe',
  'auth.startGroupBody':
    'Commencez pour un parent ou un grand-parent, puis invitez le reste de la famille à ajouter ce dont ils se souviennent.',
  'auth.joinTitle': 'Rejoindre avec un code',
  'auth.joinBody': 'Quelqu’un a déjà commencé et vous a envoyé un code de six lettres.',
  'auth.inviteCode': 'Code d’invitation',
  'auth.needNameAndCode': 'Votre nom et le code d’invitation sont tous les deux nécessaires.',
};
