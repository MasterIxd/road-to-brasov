// Everything personal lives here. Edit this file, the rest of the game reads from it.
// Texts are drawn with a pixel font: use A-Z, 0-9 and simple punctuation (. , ! ? ' : - + / € # →).
window.CONFIG = {
  name: 'DIMA',
  friend: 'OLEH',
  prizeAmount: '€100',
  from: 'BUCHAREST',
  to: 'BRASOV',

  // Prize link in base64 so it does not show up in plain text.
  // Encode in Terminal:  echo -n 'https://...' | base64
  // Empty string = final screen says the link is not set yet.
  prizeLinkB64: 'aHR0cHM6Ly9yZXZvbHV0Lm1lL3AvejNPTFR1eml0RA==',

  // Level 2 (quiz battle vs TRAIN DELAY). 2-4 options each, `answer` = index of the right option (0-based).
  // A question wraps at 34 characters; three lines is the most that fits together with four options.
  quiz: [
    {
      q: 'IN WHICH COUNTRY DID YOU WORK TOGETHER WITH OLEH?',
      options: ['ALBANIA', 'USA', 'GREECE', 'TURKEY'],
      answer: 3,
    },
    {
      q: 'WHAT ANIMAL COSTUMES DID YOU AND OLEH WEAR WHEN YOU WERE ANIMATORS AT THE PARTY?',
      options: ['GIRAFFE', 'CAT', 'ELEPHANT', 'TIGER'],
      answer: 2,
    },
    {
      q: 'WHERE SHOULD YOU LIVE?',
      options: ['BUCHAREST', 'BRASOV', 'ON THIS TRAIN, APPARENTLY'],
      answer: 1,
    },
  ],

  // Short lines shown on level intro cards.
  tips: [
    'ESCAPE BUCHAREST! GRAB 10 COINS FOR THE TICKET AND RUN TO BRASOV.',
    'A WILD TRAIN DELAY APPEARED!',
    'BRAN CASTLE. FIND THE KEY TO BRASOV. SHOO THE BEARS AWAY.',
    'DN1 TO BRASOV. FIRST THE JAM AND THE SMOG, THEN THE MOUNTAINS. WEAVE THROUGH!',
    'BUCHAREST ITSELF DOES NOT WANT YOU TO LEAVE. BLOW ITS SMOG AWAY WITH FRESH AIR, THEN JUMP ON ITS HEAD!',
  ],
};
