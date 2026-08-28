export type PortalContentBlock =
  | {
      kind: "paragraph";
      text: string;
    }
  | {
      kind: "emphasis";
      lines: string[];
    };

export type RetreatExperience = "solo" | "couples" | "group" | "custom";

export type PortalContentTile = {
  id: string;
  eyebrow: string;
  title: string;
  teaser: string;
  modalTitle: string;
  content: PortalContentBlock[];
};

export type RetreatExperienceContent = {
  id: RetreatExperience;
  label: string;
  tileTitle: string;
  tileTeaser: string;
  modalTitle: string;
  content: PortalContentBlock[];
};

export const fallbackExperienceTile = {
  title: "What to Expect",
  teaser: "Discover the different ways a Filthy Princess experience can unfold.",
};

export function normalizeRetreatExperience(
  retreatType: string | null | undefined,
): RetreatExperience | null {
  const value = retreatType?.trim().toLowerCase();

  if (!value) {
    return null;
  }

  if (value === "solo") {
    return "solo";
  }

  if (value === "couples" || value === "couple") {
    return "couples";
  }

  if (value === "private group" || value === "group") {
    return "group";
  }

  if (
    value === "i am not sure yet" ||
    value === "not sure yet" ||
    value === "custom"
  ) {
    return "custom";
  }

  return null;
}

export const retreatExperienceContent: Record<
  RetreatExperience,
  RetreatExperienceContent
> = {
  solo: {
    id: "solo",
    label: "Solo",
    tileTitle: "Your Solo Retreat",
    tileTeaser:
      "A deeply personal journey of luxury, attention, exploration and time entirely for yourself.",
    modalTitle: "A Journey Made Entirely Yours",
    content: [
      {
        kind: "paragraph",
        text: "A solo retreat is for the guest who wants to disappear from ordinary life for a while and experience something intensely personal.",
      },
      {
        kind: "paragraph",
        text: "Think luxury, pampering, exploration and the delicious feeling of being thoroughly spoiled.",
      },
      {
        kind: "paragraph",
        text: "For the duration of the experience, Cally becomes your personal hostess and guide.",
      },
      {
        kind: "paragraph",
        text: "But attention doesn't mean constant company.",
      },
      {
        kind: "paragraph",
        text: "Carefully designed periods alone are an important part of the journey - opportunities to rest, fantasise, meditate, explore yourself or simply lie somewhere beautiful and allow your thoughts to wander.",
      },
      {
        kind: "paragraph",
        text: "A solo retreat creates room for one person's curiosity to become the centre of the experience.",
      },
    ],
  },
  couples: {
    id: "couples",
    label: "Couples",
    tileTitle: "Your Couples Retreat",
    tileTeaser:
      "Step outside ordinary life together and rediscover trust, curiosity and desire.",
    modalTitle: "Rediscover Each Other",
    content: [
      {
        kind: "paragraph",
        text: "A five-day private experience for you and your partner.",
      },
      {
        kind: "paragraph",
        text: "For a few days, Cally enters the centre of your relationship as a guide and catalyst for curiosity.",
      },
      {
        kind: "paragraph",
        text: "The experience explores communication, trust, attraction, fantasy and the sometimes surprisingly difficult art of telling another person what we actually want.",
      },
      {
        kind: "paragraph",
        text: "There are experiences together.",
      },
      {
        kind: "paragraph",
        text: "There are experiences individually.",
      },
      {
        kind: "paragraph",
        text: "And there is deliberately time apart.",
      },
      {
        kind: "paragraph",
        text: "Because sometimes being given the opportunity to miss each other is exactly what allows desire to return with a little more intensity.",
      },
      {
        kind: "paragraph",
        text: "The goal isn't to redefine your relationship for you.",
      },
      {
        kind: "paragraph",
        text: "It's to create an unusual environment in which you can rediscover it together.",
      },
    ],
  },
  group: {
    id: "group",
    label: "Group",
    tileTitle: "Your Group Experience",
    tileTeaser:
      "Playful, social and unapologetically Filthy - an experience designed to be shared.",
    modalTitle: "Raw. Playful. Social.",
    content: [
      {
        kind: "paragraph",
        text: "These are the energetic ones.",
      },
      {
        kind: "paragraph",
        text: "Typically built around a three-night stay, group experiences combine crafted events, workshops, adventures, social experiences and adult exploration.",
      },
      {
        kind: "paragraph",
        text: "Cally becomes the playful centre around which the experience unfolds.",
      },
      {
        kind: "paragraph",
        text: "Expect laughter, unpredictability, confidence-building experiences, plenty of personality and permission to stop taking yourself quite so seriously.",
      },
      {
        kind: "paragraph",
        text: "This is where the name Filthy Princess gets particularly playful.",
      },
      {
        kind: "emphasis",
        lines: ["Raw.", "Filthy.", "Fun."],
      },
      {
        kind: "paragraph",
        text: "Yet underneath the mischief is something meaningful: becoming more comfortable expressing yourself around other people while developing the internal security to know your own boundaries.",
      },
    ],
  },
  custom: {
    id: "custom",
    label: "Custom",
    tileTitle: "Discover Your Retreat",
    tileTeaser:
      "You don't need to know exactly what you want yet. That's part of the journey.",
    modalTitle: "I Don't Know What I Want Yet",
    content: [
      {
        kind: "paragraph",
        text: "Perfect.",
      },
      {
        kind: "paragraph",
        text: "You don't need to arrive here with a perfectly articulated fantasy.",
      },
      {
        kind: "paragraph",
        text: "We'll use your conversations with us to understand what attracted you to Filthy Princess in the first place.",
      },
      {
        kind: "paragraph",
        text: "Maybe an existing retreat suits you.",
      },
      {
        kind: "paragraph",
        text: "Maybe several ideas should be combined.",
      },
      {
        kind: "paragraph",
        text: "Maybe what you're searching for hasn't been designed yet.",
      },
      {
        kind: "paragraph",
        text: "The first step isn't choosing an activity.",
      },
      {
        kind: "emphasis",
        lines: ["It's discovering the desire underneath it."],
      },
    ],
  },
};

export const retreatExperienceOrder: RetreatExperience[] = [
  "solo",
  "couples",
  "group",
  "custom",
];

export const portalContentTiles: PortalContentTile[] = [
  {
    id: "philosophy",
    eyebrow: "OUR PHILOSOPHY",
    title: "Reclaiming Filthy",
    teaser:
      "What if the parts of ourselves we were taught to hide could become something beautiful?",
    modalTitle: "Filthy, Reimagined",
    content: [
      { kind: "paragraph", text: "Sexuality is part of being human." },
      {
        kind: "paragraph",
        text: "Desire, fantasy, pleasure, curiosity and connection are natural experiences, yet generations of social conditioning have taught many people to surround sexuality with shame, secrecy and judgement.",
      },
      {
        kind: "paragraph",
        text: "Filthy Princess explores another possibility.",
      },
      {
        kind: "paragraph",
        text: "We use the word filthy deliberately - not to describe something shameful, but to reclaim the parts of ourselves we may have been taught to hide.",
      },
      {
        kind: "paragraph",
        text: "The intention of the experience is to explore the body, mind and soul through sensory, emotional, spiritual and sexual experiences. We question old patterns, become curious about desire and create space for people to discover what sexuality means to them without needing to fit somebody else's definition.",
      },
      { kind: "paragraph", text: "All genders are welcome." },
      {
        kind: "paragraph",
        text: "Different bodies. Different identities. Different desires. Different boundaries.",
      },
      {
        kind: "paragraph",
        text: "There is no single correct way to experience sexuality here.",
      },
      {
        kind: "paragraph",
        text: "Some Filthy Princess retreats may be offered as private experiences that can be purchased directly.",
      },
      {
        kind: "paragraph",
        text: "Others cannot be purchased at all. They are offered as complimentary experiences by invitation.",
      },
      {
        kind: "emphasis",
        lines: [
          "Sometimes you choose the retreat.",
          "Sometimes the retreat chooses you.",
        ],
      },
    ],
  },
  {
    id: "meet-cally",
    eyebrow: "YOUR HOSTESS",
    title: "Meet Cally",
    teaser:
      "Meet the playful, unfiltered Futanari Princess at the heart of the experience.",
    modalTitle: "Meet the Raw, Unfiltered Futanari Princess",
    content: [
      {
        kind: "paragraph",
        text: "Meet Cally - your hostess, guide and the mischievous heart at the centre of Filthy Princess.",
      },
      {
        kind: "paragraph",
        text: "Day to day, Cally is a cute princess who loves fashion, glamour, beauty, playfulness and exploring her connection with the universe.",
      },
      { kind: "paragraph", text: "But there is another side to her." },
      {
        kind: "paragraph",
        text: "Cally describes herself as a Futanari Princess - an expression of femininity, sexuality and gender that deliberately refuses to fit neatly into conventional boxes.",
      },
      {
        kind: "paragraph",
        text: "Her personal mythology reaches further still.",
      },
      {
        kind: "paragraph",
        text: "Cally imagines an ancient sexual DNA running through her - a symbolic connection to the fierce, transformative energy of the Goddess Kali.",
      },
      {
        kind: "paragraph",
        text: "After experiencing an intense personal awakening that changed her relationship with her body, sexuality and deepest desires, Cally began imagining an experience through which she could share that exploration with adults who genuinely resonate with it.",
      },
      { kind: "paragraph", text: "Filthy Princess is that world." },
      {
        kind: "emphasis",
        lines: ["Not everyone will understand it.", "They don't need to."],
      },
    ],
  },
  {
    id: "retreat",
    eyebrow: "THE SETTING",
    title: "Somewhere Between Ocean & Forest",
    teaser:
      "Warm air, wild beauty, private luxury and enough distance from ordinary life to disappear.",
    modalTitle: "Somewhere Between Ocean and Forest",
    content: [
      {
        kind: "paragraph",
        text: "Imagine waking somewhere private and beautiful.",
      },
      { kind: "paragraph", text: "Forest around you." },
      { kind: "paragraph", text: "Ocean air drifting through the property." },
      { kind: "paragraph", text: "Warmth and humidity against your skin." },
      {
        kind: "paragraph",
        text: "The outside world suddenly feeling wonderfully far away.",
      },
      {
        kind: "paragraph",
        text: "The retreat is designed to provide contrast: adventure and stillness, stimulation and recovery, social connection and solitude.",
      },
      {
        kind: "paragraph",
        text: "Warm, luxurious accommodation gives you somewhere private and comfortable to return to after the day's experiences.",
      },
      { kind: "paragraph", text: "Because recovery is part of the experience too." },
      { kind: "paragraph", text: "Good food." },
      { kind: "paragraph", text: "Long showers." },
      { kind: "paragraph", text: "Soft beds." },
      { kind: "paragraph", text: "Quiet mornings." },
      {
        kind: "paragraph",
        text: "And enough privacy to simply disappear for a while.",
      },
    ],
  },
  {
    id: "experiences",
    eyebrow: "EXPLORE",
    title: "Body. Mind. Nature. Energy.",
    teaser:
      "Picnics, nature, workshops, relaxation, curiosity and experiences designed around you.",
    modalTitle: "Body. Mind. Nature. Energy.",
    content: [
      {
        kind: "paragraph",
        text: "No two retreat programmes need to be identical.",
      },
      {
        kind: "paragraph",
        text: "Depending on the experience, activities may include relaxing picnics designed to nourish the body and mind; a traditional South African braai with the occasional mischievous twist; nature walks and playful hikes; massage and relaxation treatments; stretching, meditation and body-awareness practices; conversations about sexuality, fantasy and desire; and private or group workshops.",
      },
      {
        kind: "paragraph",
        text: "Some workshops explore sexuality through a spiritual lens.",
      },
      {
        kind: "paragraph",
        text: "These may draw inspiration from concepts such as Kundalini, meditation, breath, attention, movement and awareness of sensation.",
      },
      { kind: "paragraph", text: "Others explore something more psychological:" },
      {
        kind: "emphasis",
        lines: [
          "What happens when we become curious about the things we normally avoid thinking about?",
        ],
      },
      {
        kind: "paragraph",
        text: "Fantasy and taboo can create powerful emotional responses. Rather than automatically treating those responses as shameful, the experience creates space to examine them consciously and safely.",
      },
      {
        kind: "paragraph",
        text: "The objective isn't to tell you what you should want.",
      },
      { kind: "paragraph", text: "It's to help you become better at hearing yourself." },
    ],
  },
  {
    id: "deepest-itch",
    eyebrow: "SEXUAL AWAKENING",
    title: "Find the Deepest Itch",
    teaser:
      "Beyond what you know you enjoy may be something you haven't learned how to name yet.",
    modalTitle: "The Deepest Itch",
    content: [
      { kind: "paragraph", text: "Many people can describe what they enjoy." },
      {
        kind: "paragraph",
        text: "Far fewer have ever had the opportunity to ask why.",
      },
      { kind: "paragraph", text: "What creates anticipation?" },
      { kind: "paragraph", text: "What makes your senses sharpen?" },
      {
        kind: "paragraph",
        text: "What makes you feel vulnerable, powerful, beautiful, mischievous, desired or completely alive?",
      },
      {
        kind: "paragraph",
        text: "Filthy Princess calls this searching for the deepest itch.",
      },
      {
        kind: "paragraph",
        text: "It is the curiosity that exists underneath the obvious fantasy.",
      },
      {
        kind: "paragraph",
        text: "Through reflection, conversation, sensory awareness, meditation and carefully designed experiences, guests are encouraged to become conscious of their own patterns of desire.",
      },
      {
        kind: "paragraph",
        text: "Once you can feel the itch, you can begin discovering what actually reaches it.",
      },
    ],
  },
  {
    id: "preparing",
    eyebrow: "BEFORE YOU ARRIVE",
    title: "The Journey Starts Here",
    teaser: "Your retreat begins gently, long before you pack your bags.",
    modalTitle: "Come As You Are",
    content: [
      { kind: "paragraph", text: "There is no Filthy Princess uniform." },
      { kind: "paragraph", text: "Bring the glamorous dress." },
      { kind: "paragraph", text: "Bring the baggy jeans." },
      { kind: "paragraph", text: "Bring something outrageous." },
      {
        kind: "paragraph",
        text: "Bring the clothes that make you feel sexy.",
      },
      {
        kind: "paragraph",
        text: "Bring the clothes you disappear into when you want to be comfortable.",
      },
      { kind: "paragraph", text: "Most importantly, bring yourself." },
      {
        kind: "paragraph",
        text: "You'll also receive practical packing information appropriate to your particular retreat - and yes, sunscreen and a hat are highly recommended.",
      },
      {
        kind: "paragraph",
        text: "Your portal will gradually unlock preparation material before your arrival.",
      },
      {
        kind: "paragraph",
        text: "This may include gentle exercises, meditation, reflection prompts, affirmations and other preparation designed to help you transition into the experience.",
      },
      {
        kind: "paragraph",
        text: "You'll also have opportunities to attend online workshops with Cally.",
      },
      {
        kind: "paragraph",
        text: "Before travelling, a private meeting gives us the opportunity to discuss expectations, questions, concerns and boundaries.",
      },
      {
        kind: "emphasis",
        lines: ["You shouldn't arrive wondering what you've agreed to."],
      },
    ],
  },
  {
    id: "consent-boundaries",
    eyebrow: "YOUR SAFETY",
    title: "Freedom Requires Boundaries",
    teaser:
      "Curiosity can go further when everyone knows where the boundaries are.",
    modalTitle: "Freedom Requires Boundaries",
    content: [
      {
        kind: "paragraph",
        text: "Filthy Princess is an adults-only experience that may include explicitly sexual themes and activities.",
      },
      {
        kind: "paragraph",
        text: "That makes clear consent and boundaries fundamental to the experience.",
      },
      {
        kind: "paragraph",
        text: "Participation in a retreat never creates blanket consent.",
      },
      {
        kind: "paragraph",
        text: "Every person retains ownership of their body and may decline or stop an activity. Consent to one experience does not automatically imply consent to another.",
      },
      { kind: "paragraph", text: "Cally has boundaries too." },
      {
        kind: "paragraph",
        text: "As hostess, she may decline, modify or stop an interaction whenever something falls outside her personal boundaries or the agreed experience.",
      },
      {
        kind: "paragraph",
        text: "Before arrival, the itinerary and its boundaries are discussed together.",
      },
      {
        kind: "paragraph",
        text: "Some moments may naturally evolve or be improvised, but only within boundaries that everyone involved understands and accepts.",
      },
      {
        kind: "paragraph",
        text: "The purpose of boundaries isn't to make the experience less adventurous.",
      },
      {
        kind: "emphasis",
        lines: ["They are what make genuine exploration possible."],
      },
    ],
  },
  {
    id: "health-safety",
    eyebrow: "TAKE CARE",
    title: "Know. Understand. Choose.",
    teaser:
      "Taking care of our bodies gives us the freedom to explore with confidence.",
    modalTitle: "Take Care of the Body Carrying You",
    content: [
      {
        kind: "paragraph",
        text: "Guests may be required to complete appropriate health screening before participating in particular retreat activities.",
      },
      {
        kind: "paragraph",
        text: "A medical condition does not automatically exclude someone.",
      },
      {
        kind: "paragraph",
        text: "Instead, it may mean that an activity needs to be adapted, additional precautions are appropriate, or a particular boundary needs to be established.",
      },
      {
        kind: "paragraph",
        text: "Depending on the activities involved, sexual-health screening, contraception and barrier requirements may also form part of the retreat's health protocol.",
      },
      {
        kind: "paragraph",
        text: "These requirements are established before the retreat rather than negotiated in the moment.",
      },
      {
        kind: "paragraph",
        text: "Privacy and dignity matter throughout this process.",
      },
      { kind: "paragraph", text: "The objective is simple:" },
      {
        kind: "emphasis",
        lines: [
          "Know the boundaries.",
          "Understand the risks.",
          "Make informed choices.",
          "Take care of one another.",
        ],
      },
      { kind: "paragraph", text: "Then enjoy the experience." },
    ],
  },
];
