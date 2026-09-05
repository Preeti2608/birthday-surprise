/* ============================================================
   ✨ BIRTHDAY WEBSITE CUSTOMIZATION
   ------------------------------------------------------------
   This is the file where you can customize text, names, and
   memories for your friend. Everything below is plain text.
   ============================================================ */

const CONFIG = {

  // ---------- WHO THIS IS FOR ----------
  friendName: "Birthday Boy",    // your best friend's first name
  yourName: "Your Best Friend",  // your name / nickname

  // ---------- SCENE 1 — OPENING ----------
  opening: {
    lines: [
      "Hey... you there.",
      "Yeah, you. The birthday boy.",
      "I built a special surprise just for you."
    ],
    buttonText: "Enter the Surprise ✨"
  },

  // ---------- SCENE 2 — CAKE ----------
  cake: {
    candleCount: 5,
    linesBefore: ["First things first...", "Close your eyes & make a wish."],
    instruction: "Blow out the candles (or tap them)! 🎂",
    linesAfter: ["Wish locked in? Perfect. 🌟", "Now let's unwrap your birthday treats!"],
    continueButtonText: "Unwrap Chocolates →"
  },

  // ---------- SCENE 3 — FIRST MESSAGE ----------
  envelope: {
    linesBefore: ["Before we get to the sweet stuff...", "There's a note waiting for you."],
    openButtonText: "Open Letter ✉️",
    message:
      `Happy Birthday, legend! 🎉

Through all the late-night talks, wild plans, inside jokes, and endless laughs, having a friend like you makes life a million times better. 

Hope this year brings you all the success, happiness, and chaotic fun you deserve!`,
    linesAfter: ["Okay, enough sentimental talk for a second...", "Time for chocolate! 🍫"],
    nextButtonText: "Start Chocolate Trail →"
  },

  // ---------- SCENE 4 — CHOCOLATE JOURNEY ----------
  chocolates: {
    intro: {
      lines: ["Level 1 unlocked. Let's see what sweets you've earned! 🍬"]
    },
    toffee: {
      level: "Level 1: Caramel Toffee 🍬",
      tagline: "A little sweet bite to kick things off.",
      tapInstruction: "Tap to unwrap 🍬",
      message: "A little sweet bite for a guy who has survived all my terrible jokes!",
      after: "Warm up completed!",
      buttonText: "Next Chocolate →"
    },
    small: {
      level: "Level 2: Nestlé KitKat Wafer 🍫",
      tagline: "Have a break, have a KitKat snap!",
      tapInstruction: "Tap to snap & unwrap 🍫",
      message: "Here's to taking a break from all the stress and enjoying life with legendary memories!",
      after: "Crispy wafer snap completed! ⚡",
      buttonText: "Keep Going →"
    },
    dairyMilk: {
      level: "Level 3: Cadbury Dairy Milk SILK (Fruit & Nut) 💜",
      tagline: "Locked under silky chocolate security!",
      shakeInstruction: "SHAKE YOUR PHONE OR TAP FAST! 📱⚡",
      fallbackButtonText: "Tap repeatedly to shake! ⚡",
      afterShake: ["Boom! Silk unlocked! 💥", "Unwrap the smooth Fruit & Nut silkiness!"],
      message: "May your life be as smooth, sweet, and rich as a fresh block of Cadbury Silk Fruit & Nut!",
      after: "Wait, we're not done yet...",
      buttonText: "The Grand Finale →"
    },
    big: {
      level: "Level 4: Credit Suisse 500g Gold Bar 👑",
      tagline: "Pure 999,9 fine gold bar chocolate for a priceless friend.",
      tapInstruction: "Tap to unwrap the 500g gold ingot 👑",
      message: "You're pure gold! Genuinely one of a kind, priceless, and legendary. Thanks for always being an amazing friend!",
      after: "You unlocked the ultimate gold tier standard!",
      buttonText: "Open Final Gift Box 🎁"
    }
  },

  // ---------- SCENE 5 — FINAL GIFT ----------
  gift: {
    linesBefore: ["Alright...", "The ultimate birthday box is right here.", "Ready for the big reveal?"],
    openButtonText: "Open Gift Box 🎁",
    letter:
      `Dear Birthday Boy,

Happy Birthday! 🎉

I wanted to make something unique just for you today because you deserve the absolute best. Thank you for being such an incredible friend, for all the laughter, and for all the unforgettable moments we've shared.

May this new year of your life be filled with massive wins, great health, infinite joy, and everything you're aiming for. Never stop being the awesome person you are!`,
    signOff: "Happy Birthday once again, bestuuuuuuu! ❤️✨"
  },

  // ---------- SCENE 6 — MEMORY GALLERY ----------
  memories: [
    { image: "assets/photos/memory1.jpg", caption: "The beginning of the legend! 🚀", date: "" },
    { image: "assets/photos/memory2.jpg", caption: "Unstoppable chaos! 😂", date: "" },
    { image: "assets/photos/memory3.jpg", caption: "Best times ever. 🌟", date: "" },
    { image: "assets/photos/memory4.jpg", caption: "Certified partners in crime! 👊", date: "" },
    { image: "assets/photos/memory5.jpg", caption: "One for the books! 📸", date: "" }
  ],

  // ---------- SCENE 7 — FINAL SCREEN ----------
  finalScreen: {
    heading: "HAPPY BIRTHDAY, {name}! 🎉",
    lines: [
      "Here's to another year of epic conversations, random late-night plans, endless laughter, and surviving each other's nonsense!",
      "Keep shining, keep winning, and stay amazing as always! ✨",
      "Happy Birthday, Bandarrr! ❤️🎂"
    ],
    replayButtonText: "Replay the Surprise ↻"
  },

  // ---------- MUSIC & SFX ----------
  music: {
    src: "assets/music/background.mp3",
    sfxCandle: "assets/music/blow.mp3",
    sfxUnwrap: "assets/music/unwrap.mp3",
    sfxOpen: "assets/music/open.mp3",
    sfxConfetti: "assets/music/celebrate.mp3"
  }
};
